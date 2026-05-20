import { ILike, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { VacationRequest, VacationStatus } from '../../entities/VacationRequest';
import { User } from '../../entities/User';
import { AppError } from '../../utils/AppError';
import { getIO } from '../../socket';

const vrRepo = () => AppDataSource.getRepository(VacationRequest);

export async function submit(
  requesterId: number,
  startDate: string,
  endDate: string,
  reason: string | null,
) {
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

  const saved = await vrRepo().findOne({
    where: { id: request.id },
    relations: { requester: true },
  });
  getIO()?.to('role:Validator').emit('vacation:new', saved);
  return saved;
}

export async function getOwn(requesterId: number) {
  return vrRepo().find({
    where: { requester: { id: requesterId } },
    order: { createdAt: 'DESC' },
  });
}

export async function getAll(status?: VacationStatus, limit = 50, offset = 0, name?: string) {
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (name) where.requester = { name: ILike(`%${name}%`) };

  return vrRepo().find({
    where,
    relations: { requester: true, validator: true },
    order: { updatedAt: 'DESC' },
    take: limit,
    skip: offset,
  });
}

export async function approve(requestId: number, validatorId: number) {
  const request = await vrRepo().findOne({
    where: { id: requestId },
    relations: { requester: true },
  });
  if (!request) throw new AppError('Request not found', 404);
  if (request.requester.id === validatorId) throw new AppError('You cannot approve your own request', 403);
  if (request.status === VacationStatus.Approved) throw new AppError('Request is already approved', 409);

  request.status = VacationStatus.Approved;
  request.validator = { id: validatorId } as User;
  await vrRepo().save(request);

  const approved = await vrRepo().findOne({
    where: { id: requestId },
    relations: { requester: true, validator: true },
  });
  getIO()?.to(`user:${request.requester.id}`).emit('vacation:approved', approved);
  return approved;
}

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

export async function getStats() {
  const all = await vrRepo().find({ relations: { requester: true } });

  const statusCounts = { Pending: 0, Approved: 0, Rejected: 0 };
  for (const r of all) statusCounts[r.status]++;

  // Weekly window: 100 weeks past → current → 50 weeks ahead (150 data points)
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

    const approvedIds = new Set<number>();
    const activeIds = new Set<number>();
    let submissions = 0;

    for (const r of all) {
      if (r.startDate <= endStr && r.endDate >= startStr) {
        if (r.status === VacationStatus.Approved) approvedIds.add(r.requester.id);
        if (r.status === VacationStatus.Approved || r.status === VacationStatus.Pending) {
          activeIds.add(r.requester.id);
        }
      }
      const createdStr = r.createdAt.toISOString().slice(0, 10);
      if (createdStr >= startStr && createdStr <= endStr) submissions++;
    }

    weeks.push({ label: startStr, approvedCoverage: approvedIds.size, activeCoverage: activeIds.size, submissions });
  }

  return { statusCounts, weeks };
}

export async function reject(requestId: number, validatorId: number, comment: string) {
  const request = await vrRepo().findOne({
    where: { id: requestId },
    relations: { requester: true },
  });
  if (!request) throw new AppError('Request not found', 404);
  if (request.requester.id === validatorId) throw new AppError('You cannot reject your own request', 403);
  if (request.status === VacationStatus.Rejected) throw new AppError('Request is already rejected', 409);

  request.status = VacationStatus.Rejected;
  request.comment = comment;
  request.validator = { id: validatorId } as User;
  await vrRepo().save(request);

  const rejected = await vrRepo().findOne({
    where: { id: requestId },
    relations: { requester: true, validator: true },
  });
  getIO()?.to(`user:${request.requester.id}`).emit('vacation:rejected', rejected);
  return rejected;
}
