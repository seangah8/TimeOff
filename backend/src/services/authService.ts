import jwt, { SignOptions } from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { AppError } from '../utils/AppError';

const userRepo = () => AppDataSource.getRepository(User);

function signToken(user: User): string {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '24h') as SignOptions['expiresIn'] },
  );
}

export async function register(name: string, role: UserRole) {
  const existing = await userRepo().findOneBy({ name });
  if (existing) throw new AppError('Name already taken', 409);

  const user = userRepo().create({ name, role });
  await userRepo().save(user);

  return { user, token: signToken(user) };
}

export async function login(name: string) {
  const user = await userRepo().findOneBy({ name });
  if (!user) throw new AppError('No account found with that name', 404);

  return { user, token: signToken(user) };
}

export async function me(userId: number) {
  const user = await userRepo().findOneBy({ id: userId });
  if (!user) throw new AppError('User not found', 404);

  return user;
}
