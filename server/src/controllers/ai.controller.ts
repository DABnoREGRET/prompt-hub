import { NextFunction, Request, Response } from 'express';
import { analyzeContentService } from '../services/ai.service.js';
import type { AnalyzeAiInput } from '../validators/ai.schema.js';

export async function analyzeContentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const analysis = await analyzeContentService(req.body as AnalyzeAiInput);
    res.status(200).json({ analysis });
  } catch (err) {
    next(err);
  }
}
