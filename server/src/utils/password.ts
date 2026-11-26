import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/** Hashes a plain-text password with bcryptjs before persistence. */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/** Verifies a plain-text password against a stored bcrypt hash. */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
