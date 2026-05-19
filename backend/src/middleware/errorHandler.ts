import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(`[${req.method} ${req.path}]`, err);
  res.status(500).json({ success: false, error: 'Internal server error' });
}
