import {
  createUser,
  findUserRowByEmail,
  findUserRowByUsername,
  PublicUser,
  toPublicUser,
} from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import { signAccessToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import type { LoginInput, RegisterInput } from '../validators/auth.schema.js';

export interface AuthResult {
  token: string;
  user: PublicUser;
}

/** Registers a standard USER account, ensuring unique email/username and bcrypt hashing. */
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existingEmail = await findUserRowByEmail(input.email);
  if (existingEmail) {
    throw AppError.conflict('EMAIL_TAKEN', 'An account with this email already exists');
  }

  const existingUsername = await findUserRowByUsername(input.username);
  if (existingUsername) {
    throw AppError.conflict('USERNAME_TAKEN', 'This username is already taken');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    username: input.username,
    email: input.email,
    passwordHash,
    role: 'USER',
  });

  const token = signAccessToken(user);
  return { token, user };
}

/** Authenticates an active user by email and password, issuing a fresh JWT. */
export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const row = await findUserRowByEmail(input.email);
  if (!row) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const matches = await verifyPassword(input.password, row.password_hash);
  if (!matches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (!row.is_active) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'Account has been deactivated');
  }

  const user = toPublicUser(row);
  const token = signAccessToken(user);
  return { token, user };
}
