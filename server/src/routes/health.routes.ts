import { NextFunction, Request, Response, Router } from 'express';
import { getDb } from '../db/client.js';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await getDb();
    await db.query('SELECT 1 AS ok');

    res.status(200).json({
      status: 'ok',
      service: 'prompt-hub-api',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
