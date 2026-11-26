import bcrypt from 'bcryptjs';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import {
  closeDb,
  createPgliteClient,
  DbClient,
  setDbForTests,
  shouldUseSsl,
} from '../src/db/client.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seed.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { validateBody } from '../src/middlewares/validate.js';

describe('Backend & Database Foundation', () => {
  let db: DbClient;

  beforeAll(async () => {
    db = createPgliteClient('memory://');
    setDbForTests(db);
    await runMigrations(db);
    await seedDatabase(db);
  });

  afterAll(async () => {
    await closeDb();
  });

  it('detects SSL mode accurately for Render internal vs external PostgreSQL URLs', () => {
    expect(shouldUseSsl('postgresql://prompthub:pw@dpg-abc123-a/prompthub')).toBe(false);
    expect(shouldUseSsl('postgresql://postgres:postgres@localhost:5432/prompthub')).toBe(false);
    expect(
      shouldUseSsl(
        'postgresql://prompthub:pw@dpg-abc123-a.singapore-postgres.render.com/prompthub',
      ),
    ).toBe(true);
    expect(shouldUseSsl('postgresql://u:p@db.example.com:5432/app?sslmode=require')).toBe(true);
  });

  it('migrates schema and seeds demo records idempotently', async () => {
    await seedDatabase(db);

    const users = await db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
    const categories = await db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM categories');
    const tags = await db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM tags');
    const entries = await db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM entries');

    expect(Number(users.rows[0].count)).toBe(4);
    expect(Number(categories.rows[0].count)).toBe(6);
    expect(Number(tags.rows[0].count)).toBe(12);
    expect(Number(entries.rows[0].count)).toBe(16);

    const sonUser = await db.query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE email = $1',
      ['son@prompthub.dev'],
    );
    expect(sonUser.rows).toHaveLength(1);
    expect(sonUser.rows[0].password_hash).not.toBe('PromptHub123!');
    expect(await bcrypt.compare('PromptHub123!', sonUser.rows[0].password_hash)).toBe(true);
  });

  it('returns 200 ok from GET /api/health', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'prompt-hub-api',
      db: 'connected',
    });
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('returns standardized 404 NOT_FOUND for unknown routes', async () => {
    const app = createApp();
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      error: {
        code: 'NOT_FOUND',
      },
    });
  });

  it('returns standardized 422 VALIDATION_ERROR from validateBody middleware', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.post(
      '/test-validate',
      validateBody(z.object({ title: z.string().min(3) })),
      (_req, res) => res.status(200).json({ ok: true }),
    );
    testApp.use(errorHandler);

    const res = await request(testApp).post('/test-validate').send({ title: 'a' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.title).toBeDefined();
  });
});
