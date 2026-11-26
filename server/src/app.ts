import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import apiRouter from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        const normalized = origin?.replace(/\/+$/, '');
        if (!normalized || env.CORS_ORIGINS.includes(normalized)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: false,
    }),
  );

  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
