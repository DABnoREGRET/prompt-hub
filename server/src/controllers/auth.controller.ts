import { NextFunction, Request, Response } from 'express';
import { loginUser, registerUser } from '../services/auth.service.js';
import type { LoginInput, RegisterInput } from '../validators/auth.schema.js';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await registerUser(req.body as RegisterInput);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await loginUser(req.body as LoginInput);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response): void {
  res.status(200).json({ loggedOut: true });
}

export function me(req: Request, res: Response): void {
  res.status(200).json({ user: req.user });
}
