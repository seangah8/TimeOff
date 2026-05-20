import { ILike, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { VacationRequest, VacationStatus } from '../../entities/VacationRequest';
import { User } from '../../entities/User';
import { AppError } from '../../utils/AppError';
import { getIO } from '../../socket';

// Lazy getter — avoids initializing the repository before the DataSource is connected.
const vrRepo = () => AppDataSource.getRepository(VacationRequest);

// Creates a new vacation request for the given requester.
// Blocks submission if the requester already has an APPROVED request that overlaps the
// requested dates — two approved periods for the same person would be a data integrity issue.
// Overlapping PENDING requests are allowed: the validator decides which one to approve.
export async function submit(
  requesterId: number,
  startDate: string,
  endDate: string,
  reason: string | null,
) {
  // Two date ranges overlap when one starts before the other ends and vice versa.
  const overlap = await vrRepo().findOne({
    where: {
      requester: { id: requesterId },
      status: VacationStatus.Approved,
      startDate: LessThanOrEqual(endDate),
      endDate: MoreThanOrEqual(startDate),
    },
  });
  if (overlap) throw new AppError('You already have an approved request overlapping these dates', 409);

  const request = vrRepo().create({
    requester: { id: requesterId } as User,
    startDate,
    endDate,
    reason: reason ?? null,
  });
  await vrRepo().save(request);

  // Re-fetch with relations so the emitted event includes the requester's name.
  const saved = await vrRepo().findOne({
    where: { id: request.id },
    relations: { requester: true },
  });
  // Notify all connected validators in real time.
  getIO()?.to('role:Validator').emit('vacation:new', saved);
  return saved;
}

// Returns all requests submitted by this requester, newest first.
export async function getOwn(requesterId: number) {
  return vrRepo().find({
    where: { requester: { id: requesterId } },
    order: { createdAt: 'DESC' },
  });
}

// Returns a paginated list of all requests, optionally filtered by status and/or requester name.
// Sorted by updatedAt DESC so recently actioned items stay at the top of the validator's view.
export async function getAll(status?: VacationStatus, limit = 50, offset = 0, name?: string) {
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  // ILike performs a case-insensitive LIKE query, so "ali" matches "Alice" or "ALICE".
  if (name) where.requester = { name: ILike(`%${name}%`) };

  return vrRepo().find({
    where,
    relations: { requester: true, validator: true },
    order: { updatedAt: 'DESC' },
    take: limit,
    skip: offset,
  });
}

// Approves a pending vacation request and records which validator acted on it.
// Guards:
//   - 404 if the request does not exist
//   - 403 if the requester tries to approve their own request
//   - 409 if the request is not in Pending status (already approved or rejected)
//   - 409 if approving would create an overlapping approved period for this requester
export async function approve(requestId: number, validatorId: number) {
  const request = await vrRepo().findOne({
    where: { id: requestId },
    relations: { requester: true },
  });
  if (!request) throw new AppError('Request not found', 404);
  if (request.requester.id === validatorId) throw new AppError('You cannot approve your own request', 403);
  if (request.status !== VacationStatus.Pending) throw new AppError('Only pending requests can be approved', 409);

  // Check for overlap with other already-approved requests for the same requester.
  const overlap = await vrRepo().findOne({
    where: {
      requester: { id: request.requester.id },
      status: VacationStatus.Approved,
      startDate: LessThanOrEqual(request.endDate),
      endDate: MoreThanOrEqual(request.startDate),
    },
  });
  if (overlap) throw new AppError('This requester already has an approved request overlapping these dates', 409);

  request.status = VacationStatus.Approved;
  request.validator = { id: validatorId } as User;
  await vrRepo().save(request);

  // Re-fetch with full relations for the socket event payload.
  const approved = await vrRepo().findOne({
    where: { id: requestId },
    relations: { requester: true, validator: true },
  });
  // Notify only the requester whose request was approved.
  getIO()?.to(`user:${request.requester.id}`).emit('vacation:approved', approved);
  return approved;
}

// Permanently removes a vacation request from the database.
// Only the requester who submitted it can delete it, and only while it is still Pending
// (once a validator has acted on it the decision record must be preserved).
export async function deleteRequest(requestId: number, requesterId: number) {
  const request = await vrRepo().findOne({
    where: { id: requestId },
    relations: { requester: true },
  });
  if (!request) throw new AppError('Request not found', 404);
  if (request.requester.id !== requesterId) throw new AppError('You can only delete your own requests', 403);
  if (request.status !== VacationStatus.Pending) throw new AppError('Only pending requests can be deleted', 409);

  await vrRepo().remove(request);
}

// Rejects a pending vacation request and stores the validator's explanation.
// Guards mirror approve() — only Pending requests can be rejected.
export async function reject(requestId: number, validatorId: number, comment: string) {
  const request = await vrRepo().findOne({
    where: { id: requestId },
    relations: { requester: true },
  });
  if (!request) throw new AppError('Request not found', 404);
  if (request.requester.id === validatorId) throw new AppError('You cannot reject your own request', 403);
  if (request.status !== VacationStatus.Pending) throw new AppError('Only pending requests can be rejected', 409);

  request.status = VacationStatus.Rejected;
  request.comment = comment;
  request.validator = { id: validatorId } as User;
  await vrRepo().save(request);

  const rejected = await vrRepo().findOne({
    where: { id: requestId },
    relations: { requester: true, validator: true },
  });
  // Notify the requester so they see the outcome without refreshing.
  getIO()?.to(`user:${request.requester.id}`).emit('vacation:rejected', rejected);
  return rejected;
}

// Computes aggregated statistics for the validator charts page.
// All requests are loaded once and then processed in memory to avoid multiple queries.
export async function getStats() {
  const all = await vrRepo().find({ relations: { requester: true } });

  // Count requests per status for the donut chart.
  const statusCounts = { Pending: 0, Approved: 0, Rejected: 0 };
  for (const r of all) statusCounts[r.status]++;

  // Build a 151-week window: 100 weeks in the past, the current week, 50 weeks ahead.
  // For each week we count how many unique requesters had an approved (or active) vacation.
  const getMonday = (d: Date): Date => {
    const day = d.getDay();
    const copy = new Date(d);
    copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day));
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const rangeStart = getMonday(new Date());
  rangeStart.setDate(rangeStart.getDate() - 100 * 7);

  const weeks: Array<{
    label: string;
    approvedCoverage: number;
    activeCoverage: number;
    submissions: number;
  }> = [];

  for (let i = 0; i <= 150; i++) {
    const weekStart = new Date(rangeStart);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startStr = weekStart.toISOString().slice(0, 10);
    const endStr = weekEnd.toISOString().slice(0, 10);

    // Sets deduplicate requesters so each person is counted once per week even
    // if they have multiple overlapping approved requests.
    const approvedIds = new Set<number>();
    const activeIds = new Set<number>();
    let submissions = 0;

    for (const r of all) {
      // A request "covers" a week if its date range overlaps with the week's range.
      if (r.startDate <= endStr && r.endDate >= startStr) {
        if (r.status === VacationStatus.Approved) approvedIds.add(r.requester.id);
        if (r.status === VacationStatus.Approved || r.status === VacationStatus.Pending) {
          activeIds.add(r.requester.id);
        }
      }
      // Count requests submitted during this week for the submission trend chart.
      const createdStr = r.createdAt.toISOString().slice(0, 10);
      if (createdStr >= startStr && createdStr <= endStr) submissions++;
    }

    weeks.push({ label: startStr, approvedCoverage: approvedIds.size, activeCoverage: activeIds.size, submissions });
  }

  return { statusCounts, weeks };
}
