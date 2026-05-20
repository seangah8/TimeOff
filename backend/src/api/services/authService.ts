import jwt, { SignOptions } from 'jsonwebtoken';
import { AppDataSource } from '../../config/database';
import { User, UserRole } from '../../entities/User';
import { AppError } from '../../utils/AppError';

// Lazy getter — avoids initializing the repository before the DataSource is connected.
const userRepo = () => AppDataSource.getRepository(User);

// Shared helper: signs a JWT containing only the user's id and role.
// The token is placed in an httpOnly cookie by the controller — it never touches the frontend JS.
function signToken(user: User): string {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '24h') as SignOptions['expiresIn'] },
  );
}

// Creates a new user and returns both the saved record and a signed session token.
// Throws 409 if the name is already taken — names are the only identifier in this system.
export async function register(name: string, role: UserRole) {
  const existing = await userRepo().findOneBy({ name });
  if (existing) throw new AppError('Name already taken', 409);

  const user = userRepo().create({ name, role });
  await userRepo().save(user);

  return { user, token: signToken(user) };
}

// Looks up a user by name and returns a fresh session token.
// No password check — authentication is name-only in this demo context.
export async function login(name: string) {
  const user = await userRepo().findOneBy({ name });
  if (!user) throw new AppError('No account found with that name', 404);

  return { user, token: signToken(user) };
}

// Returns the full user record for the id stored in the JWT.
// Used by GET /auth/me on page load to restore the session from the cookie.
export async function me(userId: number) {
  const user = await userRepo().findOneBy({ id: userId });
  if (!user) throw new AppError('User not found', 404);

  return user;
}
