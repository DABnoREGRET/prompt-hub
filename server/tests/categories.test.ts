import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { closeDb, createPgliteClient, DbClient, setDbForTests } from '../src/db/client.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seed.js';
import { toSlug } from '../src/utils/slug.js';

describe('Categories & Tags Taxonomy API', () => {
  let db: DbClient;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    db = createPgliteClient('memory://');
    setDbForTests(db);
    await runMigrations(db);
    await seedDatabase(db);

    const app = createApp();
    const userRes = await request(app).post('/api/auth/login').send({
      email: 'dab@prompthub.dev',
      password: 'PromptHub123!',
    });
    userToken = userRes.body.token;

    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@prompthub.dev',
      password: 'Admin123!',
    });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await closeDb();
  });

  it('normalizes names into clean kebab-case slugs via toSlug', () => {
    expect(toSlug('AI & Machine Learning!')).toBe('ai-machine-learning');
    expect(toSlug('  C++ / Rust   Systems  ')).toBe('c-rust-systems');
    expect(toSlug('SQL & Data')).toBe('sql-data');
  });

  it('allows public reads on GET /api/categories and GET /api/tags', async () => {
    const app = createApp();

    const catsRes = await request(app).get('/api/categories');
    expect(catsRes.status).toBe(200);
    expect(catsRes.body.categories).toHaveLength(6);

    const tagsRes = await request(app).get('/api/tags');
    expect(tagsRes.status).toBe(200);
    expect(tagsRes.body.tags).toHaveLength(12);
  });

  it('blocks Guest (401) and USER (403) from creating, updating, or deleting categories', async () => {
    const app = createApp();

    const guestCreate = await request(app)
      .post('/api/categories')
      .send({ name: 'Security' });
    expect(guestCreate.status).toBe(401);

    const userCreate = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Security' });
    expect(userCreate.status).toBe(403);
    expect(userCreate.body.error.code).toBe('FORBIDDEN');

    const userPatch = await request(app)
      .patch('/api/categories/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Updated' });
    expect(userPatch.status).toBe(403);

    const userDelete = await request(app)
      .delete('/api/categories/1')
      .set('Authorization', `Bearer ${userToken}`);
    expect(userDelete.status).toBe(403);
  });

  it('allows ADMIN to create a category, rejects invalid payloads (422), and rejects duplicates (409)', async () => {
    const app = createApp();

    const invalid = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'A' });
    expect(invalid.status).toBe(422);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');

    const created = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Security & Auth',
        description: 'Authentication and hardening patterns',
      });
    expect(created.status).toBe(201);
    expect(created.body.category).toMatchObject({
      name: 'Security & Auth',
      slug: 'security-auth',
      description: 'Authentication and hardening patterns',
    });

    const dup = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Security Auth' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CATEGORY_EXISTS');
  });

  it('allows ADMIN to update and delete categories while keeping referenced entries intact', async () => {
    const app = createApp();

    const created = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cloud Infra', description: 'Terraform & Kubernetes' });
    expect(created.status).toBe(201);
    const catId = created.body.category.id as number;

    const updated = await request(app)
      .patch(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cloud & Kubernetes', description: 'Infra templates' });
    expect(updated.status).toBe(200);
    expect(updated.body.category).toMatchObject({
      id: catId,
      name: 'Cloud & Kubernetes',
      slug: 'cloud-kubernetes',
      description: 'Infra templates',
    });

    const missingPatch = await request(app)
      .patch('/api/categories/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Nope' });
    expect(missingPatch.status).toBe(404);

    // Attach an existing entry to this category, then delete category and verify entry survives with NULL category_id
    const anyEntry = await db.query<{ id: number }>('SELECT id FROM entries LIMIT 1');
    const entryId = anyEntry.rows[0].id;
    await db.query('UPDATE entries SET category_id = $1 WHERE id = $2', [catId, entryId]);

    const deleted = await request(app)
      .delete(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(204);

    const surviving = await db.query<{ category_id: number | null }>(
      'SELECT category_id FROM entries WHERE id = $1',
      [entryId],
    );
    expect(surviving.rows).toHaveLength(1);
    expect(surviving.rows[0].category_id).toBeNull();

    const missingDelete = await request(app)
      .delete(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(missingDelete.status).toBe(404);
  });
});
