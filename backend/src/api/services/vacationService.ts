import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { VacationRequest, VacationStatus } from '../../entities/VacationRequest';
import { User } from '../../entities/User';
import { AppError } from '../../utils/AppError';

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

  return vrRepo().findOne({
    where: { id: request.id },
    relations: { requester: true },
  });
}

export async function getOwn(requesterId: number) {
  return vrRepo().find({
    where: { requester: { id: requesterId } },
    order: { createdAt: 'DESC' },
  });
}

export async function getAll(status?: VacationStatus) {
  return vrRepo().find({
    where: status ? { status } : {},
    relations: { requester: true, validator: true },
    order: { updatedAt: 'DESC' },
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

  return vrRepo().findOne({
    where: { id: requestId },
    relations: { requester: true, validator: true },
  });
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

  return vrRepo().findOne({
    where: { id: requestId },
    relations: { requester: true, validator: true },
  });
}
