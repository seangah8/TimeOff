import { Request, Response, NextFunction } from 'express';
import * as vacationService from '../services/vacationService';
import { VacationStatus } from '../../entities/VacationRequest';

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, reason } = req.body as {
      startDate: string;
      endDate: string;
      reason?: string;
    };
    const request = await vacationService.submit(
      req.user!.userId,
      startDate,
      endDate,
      reason ?? null,
    );
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

export async function getOwn(req: Request, res: Response, next: NextFunction) {
  try {
    const requests = await vacationService.getOwn(req.user!.userId);
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
}

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as VacationStatus | undefined;
    const requests = await vacationService.getAll(status);
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await vacationService.approve(
      Number(req.params.id),
      req.user!.userId,
    );
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const { comment } = req.body as { comment: string };
    const request = await vacationService.reject(
      Number(req.params.id),
      req.user!.userId,
      comment,
    );
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}
