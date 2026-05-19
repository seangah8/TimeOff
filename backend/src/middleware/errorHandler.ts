import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(`[${req.method} ${req.path}]`, err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  res.status(500).json({ success: false, error: 'Internal server error' });
}
