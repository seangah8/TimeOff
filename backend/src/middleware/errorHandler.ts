import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

// Central error handler — Express recognises this as an error handler because it
// has four parameters (err, req, res, next). All route handlers forward errors
// via next(err) and they all land here.
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(`[${req.method} ${req.path}]`, err);

  // AppErrors are intentional (bad input, not found, conflict, etc.) and carry
  // the correct HTTP status code. Everything else is an unexpected crash → 500.
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  res.status(500).json({ success: false, error: 'Internal server error' });
}
