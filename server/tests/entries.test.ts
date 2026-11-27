import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { closeDb, createPgliteClient, DbClient, setDbForTests } from '../src/db/client.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Entries CRUD, Search/Filter/Sort & Bookmarks API', () => {
  let db: DbClient;
  let dabToken: string;
  let phanToken: string;
  let adminToken: string;

  beforeAll(async () => {
    db = createPgliteClient('memory://');
    setDbForTests(db);
    await runMigrations(db);
    await seedDatabase(db);

    const app = createApp();
    const [dabRes, phanRes, adminRes] = await Promise.all([
      request(app).post('/api/auth/login').send({
        email: 'dab@prompthub.dev',
        password: 'PromptHub123!',
      }),
      request(app).post('/api/auth/login').send({
        email: 'phan@prompthub.dev',
        password: 'PromptHub123!',
      }),
      request(app).post('/api/auth/login').send({
        email: 'admin@prompthub.dev',
        password: 'Admin123!',
      }),
    ]);

    dabToken = dabRes.body.token;
    phanToken = phanRes.body.token;
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await closeDb();
  });

  it('creates an entry with normalized deduplicated tags and rejects invalid payloads', async () => {
    const app = createApp();

    const unauth = await request(app).post('/api/entries').send({
      title: 'Unauthorized Entry',
      entryType: 'SNIPPET',
      language: 'typescript',
      content: 'console.log("hi");',
      visibility: 'PUBLIC',
    });
    expect(unauth.status).toBe(401);

    const invalid = await request(app)
      .post('/api/entries')
      .set('Authorization', `Bearer ${dabToken}`)
      .send({
        title: 'No',
        entryType: 'SNIPPET',
        language: 'ts',
        content: 'short',
        tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
      });
    expect(invalid.status).toBe(422);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');

    const badCat = await request(app)
      .post('/api/entries')
      .set('Authorization', `Bearer ${dabToken}`)
      .send({
        title: 'Valid Snippet Title',
        entryType: 'SNIPPET',
        language: 'typescript',
        categoryId: 99999,
        content: 'export const validSnippet = () => true;',
        visibility: 'PUBLIC',
      });
    expect(badCat.status).toBe(404);

    const created = await request(app)
      .post('/api/entries')
      .set('Authorization', `Bearer ${dabToken}`)
      .send({
        title: 'Zod Env Parser',
        entryType: 'SNIPPET',
        language: 'TypeScript',
        categoryId: 1,
        description: 'Parses process.env safely on startup.',
        content: 'const envSchema = z.object({ PORT: z.coerce.number() });',
        visibility: 'PRIVATE',
        tags: ['Zod', 'zod', 'TypeScript', '  env-config  '],
      });

    expect(created.status).toBe(201);
    expect(created.body.entry).toMatchObject({
      title: 'Zod Env Parser',
      entryType: 'SNIPPET',
      language: 'typescript',
      visibility: 'PRIVATE',
      authorUsername: 'dabber',
    });
    expect(created.body.entry.tags).toEqual(['env-config', 'typescript', 'zod']);
  });

  it('enforces visibility and ownership rules on GET, PATCH, and DELETE /api/entries/:id', async () => {
    const app = createApp();

    const created = await request(app)
      .post('/api/entries')
      .set('Authorization', `Bearer ${dabToken}`)
      .send({
        title: 'Dab Private Architecture Prompt',
        entryType: 'PROMPT',
        language: 'markdown',
        content: 'Review architecture for {{service_name}} with {{constraints}}.',
        visibility: 'PRIVATE',
        tags: ['architecture'],
      });
    expect(created.status).toBe(201);
    const entryId = created.body.entry.id as number;

    const guestView = await request(app).get(`/api/entries/${entryId}`);
    expect(guestView.status).toBe(403);

    const phanView = await request(app)
      .get(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${phanToken}`);
    expect(phanView.status).toBe(403);

    const dabView = await request(app)
      .get(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${dabToken}`);
    expect(dabView.status).toBe(200);
    expect(dabView.body.entry.id).toBe(entryId);

    const adminView = await request(app)
      .get(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminView.status).toBe(200);

    const phanPatch = await request(app)
      .patch(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${phanToken}`)
      .send({ title: 'Hijacked Title' });
    expect(phanPatch.status).toBe(403);

    const dabPatch = await request(app)
      .patch(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${dabToken}`)
      .send({
        title: 'Dab Public Architecture Prompt',
        visibility: 'PUBLIC',
        tags: ['code-review', 'api-design'],
      });
    expect(dabPatch.status).toBe(200);
    expect(dabPatch.body.entry.visibility).toBe('PUBLIC');
    expect(dabPatch.body.entry.tags).toEqual(['api-design', 'code-review']);

    const guestAfterPublish = await request(app).get(`/api/entries/${entryId}`);
    expect(guestAfterPublish.status).toBe(200);

    const phanDelete = await request(app)
      .delete(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${phanToken}`);
    expect(phanDelete.status).toBe(403);

    const adminDelete = await request(app)
      .delete(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDelete.status).toBe(204);

    const missingAfterDelete = await request(app).get(`/api/entries/${entryId}`);
    expect(missingAfterDelete.status).toBe(404);
  });

  it('supports search, type/category/language/tag filters, sorting, and pagination on GET /api/entries', async () => {
    const app = createApp();

    const searchRes = await request(app).get('/api/entries?q=Zod');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      searchRes.body.data.every(
        (item: { title: string; description: string; content: string; tags: string[] }) =>
          `${item.title} ${item.description} ${item.content} ${item.tags.join(' ')}`
            .toLowerCase()
            .includes('zod'),
      ),
    ).toBe(true);

    const promptCatRes = await request(app).get(
      '/api/entries?type=PROMPT&category=ai-system-prompts',
    );
    expect(promptCatRes.status).toBe(200);
    expect(promptCatRes.body.data.length).toBeGreaterThanOrEqual(4);
    for (const item of promptCatRes.body.data) {
      expect(item.entryType).toBe('PROMPT');
      expect(item.categorySlug).toBe('ai-system-prompts');
    }

    const sqlRes = await request(app).get('/api/entries?language=sql');
    expect(sqlRes.status).toBe(200);
    expect(sqlRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(sqlRes.body.data[0].language).toBe('sql');

    // Verify tag filter keeps ALL tags on matching entries intact (not truncated to just ['postgres'])
    const tagRes = await request(app).get('/api/entries?tag=postgres');
    expect(tagRes.status).toBe(200);
    expect(tagRes.body.data.length).toBeGreaterThanOrEqual(2);
    const multiTagged = tagRes.body.data.find(
      (item: { tags: string[] }) => item.tags.includes('postgres') && item.tags.length > 1,
    );
    expect(multiTagged).toBeDefined();

    const popularRes = await request(app).get('/api/entries?sortBy=popular');
    expect(popularRes.status).toBe(200);
    const counts = popularRes.body.data.map(
      (item: { bookmarkCount: number }) => item.bookmarkCount,
    );
    for (let i = 1; i < counts.length; i += 1) {
      expect(counts[i - 1]).toBeGreaterThanOrEqual(counts[i]);
    }

    const titleRes = await request(app).get('/api/entries?sortBy=title&pageSize=20');
    expect(titleRes.status).toBe(200);
    const titles = titleRes.body.data.map((item: { title: string }) => item.title.toLowerCase());
    const sortedTitles = [...titles].sort((a, b) => a.localeCompare(b));
    expect(titles).toEqual(sortedTitles);

    const page2Res = await request(app).get('/api/entries?page=2&pageSize=6');
    expect(page2Res.status).toBe(200);
    expect(page2Res.body.pagination.page).toBe(2);
    expect(page2Res.body.pagination.pageSize).toBe(6);
    expect(page2Res.body.data).toHaveLength(6);
  });

  it('toggles bookmarks idempotently, lists GET /api/bookmarks, and blocks bookmarking others PRIVATE entries', async () => {
    const app = createApp();

    // Find a PUBLIC entry not yet bookmarked by phan
    const pubList = await request(app).get('/api/entries?pageSize=20');
    const targetPublic = pubList.body.data.find(
      (e: { title: string }) => e.title === 'Multi-Stage Production Dockerfile for Node API',
    );
    expect(targetPublic).toBeDefined();
    const initialCount = targetPublic.bookmarkCount as number;

    const add1 = await request(app)
      .post(`/api/entries/${targetPublic.id}/bookmark`)
      .set('Authorization', `Bearer ${phanToken}`);
    expect(add1.status).toBe(201);
    expect(add1.body).toEqual({ bookmarked: true, bookmarkCount: initialCount + 1 });

    // Idempotent duplicate POST
    const add2 = await request(app)
      .post(`/api/entries/${targetPublic.id}/bookmark`)
      .set('Authorization', `Bearer ${phanToken}`);
    expect(add2.status).toBe(201);
    expect(add2.body).toEqual({ bookmarked: true, bookmarkCount: initialCount + 1 });

    const detailAuthed = await request(app)
      .get(`/api/entries/${targetPublic.id}`)
      .set('Authorization', `Bearer ${phanToken}`);
    expect(detailAuthed.status).toBe(200);
    expect(detailAuthed.body.entry.isBookmarked).toBe(true);

    const listBookmarks = await request(app)
      .get('/api/bookmarks')
      .set('Authorization', `Bearer ${phanToken}`);
    expect(listBookmarks.status).toBe(200);
    expect(
      listBookmarks.body.data.some((item: { id: number }) => item.id === targetPublic.id),
    ).toBe(true);

    const remove = await request(app)
      .delete(`/api/entries/${targetPublic.id}/bookmark`)
      .set('Authorization', `Bearer ${phanToken}`);
    expect(remove.status).toBe(200);
    expect(remove.body).toEqual({ bookmarked: false, bookmarkCount: initialCount });

    // Private entry authored by dab cannot be bookmarked by phan
    const dabPrivate = await db.query<{ id: number }>(
      `SELECT id FROM entries WHERE visibility = 'PRIVATE' LIMIT 1`,
    );
    const privId = dabPrivate.rows[0].id;
    const privOwner = await db.query<{ author_id: number }>(
      'SELECT author_id FROM entries WHERE id = $1',
      [privId],
    );
    const phanUser = await db.query<{ id: number }>(
      `SELECT id FROM users WHERE email = 'phan@prompthub.dev'`,
    );
    const otherToken =
      privOwner.rows[0].author_id === phanUser.rows[0].id ? dabToken : phanToken;

    const forbiddenBookmark = await request(app)
      .post(`/api/entries/${privId}/bookmark`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(forbiddenBookmark.status).toBe(403);
  });
});
