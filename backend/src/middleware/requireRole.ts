import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities/User';

// Factory middleware — returns a middleware function configured for a specific role.
// Always placed after `authenticate` in the middleware chain, because it reads
// req.user which authenticate populates.
// Example: requireRole(UserRole.Validator) blocks any non-validator from the route.
export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }
    next();
  };
}
