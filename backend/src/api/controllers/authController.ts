import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { UserRole } from '../../entities/User';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: false,
  maxAge: 24 * 60 * 60 * 1000,
};

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

export function logout(_req: Request, res: Response) {
  res.clearCookie('access_token');
  res.json({ success: true, data: null });
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.me(req.user!.userId);
    res.json({ success: true, data: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
}
