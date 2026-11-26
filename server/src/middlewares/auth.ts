import { NextFunction, Request, Response } from 'express';
import { findPublicUserById, PublicUser } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import { UserRole, verifyAccessToken } from '../utils/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

async function resolveAuthenticatedUser(token: string): Promise<PublicUser> {
  const claims = verifyAccessToken(token);
  const userId = Number(claims.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw AppError.unauthorized('Invalid authentication token');
  }

  const user = await findPublicUserById(userId);
  if (!user) {
    throw AppError.unauthorized('User account no longer exists');
  }
  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'Account has been deactivated');
  }
  return user;
}

/** Requires a valid Bearer JWT and active user account. */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw AppError.unauthorized('Missing Bearer authentication token');
    }
    req.user = await resolveAuthenticatedUser(token);
    next();
  } catch (err) {
    next(err);
  }
}

/** Populates req.user when a Bearer token is provided; allows anonymous access otherwise. */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      next();
      return;
    }
    req.user = await resolveAuthenticatedUser(token);
    next();
  } catch (err) {
    next(err);
  }
}

/** Enforces that the authenticated user holds one of the allowed RBAC roles. */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(AppError.forbidden('Insufficient permissions for this resource'));
      return;
    }
    next();
  };
}
