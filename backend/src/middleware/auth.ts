import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../entities/User';

interface JwtPayload {
  userId: number;
  role: UserRole;
}

// Reads the JWT from the httpOnly cookie and attaches the decoded user identity
// to req.user so downstream route handlers can access it without hitting the DB.
// Using a cookie instead of an Authorization header prevents JavaScript from
// reading the token, which eliminates XSS-based token theft.
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token;

  if (!token) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    // jwt.verify throws if the token is expired, tampered with, or signed with the wrong secret.
    res.status(401).json({ success: false, error: 'Invalid or expired session' });
  }
}
