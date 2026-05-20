import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { UserRole } from '../../entities/User';

// Cookie settings applied to the access_token on every login/register response.
// httpOnly: JS cannot read the cookie → prevents XSS token theft.
// sameSite strict: cookie is not sent on cross-site requests → prevents CSRF.
// secure: false in development (no HTTPS); set to true in production.
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: false,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Controllers are intentionally thin — they only handle HTTP concerns (reading the
// request body, setting the cookie, shaping the response). Business logic lives in the service.

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, role } = req.body as { name: string; role: UserRole };
    const { user, token } = await authService.register(name, role);
    res.cookie('access_token', token, COOKIE_OPTIONS);
    res.status(201).json({ success: true, data: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.body as { name: string };
    const { user, token } = await authService.login(name);
    res.cookie('access_token', token, COOKIE_OPTIONS);
    res.json({ success: true, data: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
}

// Logout just clears the cookie — no server-side session to invalidate.
export function logout(_req: Request, res: Response) {
  res.clearCookie('access_token');
  res.json({ success: true, data: null });
}

// Returns the current user from the DB using the id already verified in the JWT.
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.me(req.user!.userId);
    res.json({ success: true, data: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
}
