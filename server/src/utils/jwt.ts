import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

export type UserRole = 'USER' | 'ADMIN';

export interface AccessTokenClaims {
  sub: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface TokenSubject {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

/** Signs a short-lived Bearer JWT containing sanitized user identity claims. */
export function signAccessToken(user: TokenSubject): string {
  const payload: Omit<AccessTokenClaims, 'sub'> = {
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/** Verifies a Bearer JWT and returns parsed claims, throwing 401 on invalid tokens. */
export function verifyAccessToken(token: string): AccessTokenClaims {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.sub !== 'string' ||
      typeof (decoded as Record<string, unknown>).username !== 'string' ||
      typeof (decoded as Record<string, unknown>).email !== 'string' ||
      ((decoded as Record<string, unknown>).role !== 'USER' &&
        (decoded as Record<string, unknown>).role !== 'ADMIN')
    ) {
      throw AppError.unauthorized('Invalid authentication token');
    }

    const record = decoded as jwt.JwtPayload & {
      username: string;
      email: string;
      role: UserRole;
    };

    return {
      sub: decoded.sub,
      username: record.username,
      email: record.email,
      role: record.role,
    };
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw AppError.unauthorized('Invalid or expired authentication token');
  }
}
