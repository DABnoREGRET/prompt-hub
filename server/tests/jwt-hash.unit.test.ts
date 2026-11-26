import { describe, expect, it } from 'vitest';
import { AppError } from '../src/utils/AppError.js';
import { signAccessToken, verifyAccessToken } from '../src/utils/jwt.js';
import { hashPassword, verifyPassword } from '../src/utils/password.js';

describe('Password & JWT Utilities', () => {
  it('hashes passwords securely and verifies matching vs mismatched passwords', async () => {
    const plain = 'PromptHub123!';
    const hashed = await hashPassword(plain);

    expect(hashed).not.toBe(plain);
    expect(hashed.startsWith('$2')).toBe(true);
    expect(await verifyPassword(plain, hashed)).toBe(true);
    expect(await verifyPassword('WrongPass999!', hashed)).toBe(false);
  });

  it('signs and verifies access tokens with expected user claims', () => {
    const token = signAccessToken({
      id: 42,
      username: 'sonpham',
      email: 'son@prompthub.dev',
      role: 'USER',
    });

    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('42');
    expect(payload.username).toBe('sonpham');
    expect(payload.email).toBe('son@prompthub.dev');
    expect(payload.role).toBe('USER');
  });

  it('throws 401 AppError when verifying an invalid or tampered JWT', () => {
    let caught: unknown;
    try {
      verifyAccessToken('not.a.valid.jwt.token');
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).statusCode).toBe(401);
    expect((caught as AppError).code).toBe('UNAUTHORIZED');
  });
});
