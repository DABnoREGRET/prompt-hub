import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { closeDb, createPgliteClient, DbClient, setDbForTests } from '../src/db/client.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Catalog Read Endpoints (Categories, Tags & Entries)', () => {
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

  it('returns all seeded categories with public entry counts from GET /api/categories', async () => {
    const app = createApp();
    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(6);
    expect(res.body.categories[0]).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      slug: expect.any(String),
      description: expect.any(String),
      entryCount: expect.any(Number),
    });
  });

  it('returns all seeded tags from GET /api/tags', async () => {
    const app = createApp();
    const res = await request(app).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body.tags).toHaveLength(12);
    expect(res.body.tags[0]).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
    });
  });

  it('returns paginated PUBLIC entries with author, category, tags, and bookmarkCount', async () => {
    const app = createApp();
    const res = await request(app).get('/api/entries?page=1&pageSize=12');

    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual({
      page: 1,
      pageSize: 12,
      total: 14,
      totalPages: 2,
    });
    expect(res.body.data).toHaveLength(12);
    for (const entry of res.body.data) {
      expect(entry.visibility).toBe('PUBLIC');
      expect(typeof entry.authorUsername).toBe('string');
      expect(Array.isArray(entry.tags)).toBe(true);
      expect(typeof entry.bookmarkCount).toBe('number');
    }
  });

  it('guards GET /api/entries/mine and returns both PUBLIC and PRIVATE entries for owner', async () => {
    const app = createApp();

    const unauth = await request(app).get('/api/entries/mine');
    expect(unauth.status).toBe(401);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'dab@prompthub.dev',
      password: 'PromptHub123!',
    });
    expect(loginRes.status).toBe(200);

    const mineRes = await request(app)
      .get('/api/entries/mine')
      .set('Authorization', `Bearer ${loginRes.body.token}`);
    expect(mineRes.status).toBe(200);
    expect(mineRes.body.data.length).toBeGreaterThanOrEqual(2);
    expect(
      mineRes.body.data.some((item: { visibility: string }) => item.visibility === 'PRIVATE'),
    ).toBe(true);
  });
});
