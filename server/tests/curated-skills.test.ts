import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { closeDb, createPgliteClient, setDbForTests } from '../src/db/client.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seed.js';

describe('SKILL.md Vault Entries & Curated AI Harness Skills API', () => {
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const db = createPgliteClient('memory://');
    setDbForTests(db);
    await runMigrations(db);
    await seedDatabase(db);

    const app = createApp();
    const [userRes, adminRes] = await Promise.all([
      request(app).post('/api/auth/login').send({
        email: 'son@prompthub.dev',
        password: 'PromptHub123!',
      }),
      request(app).post('/api/auth/login').send({
        email: 'admin@prompthub.dev',
        password: 'Admin123!',
      }),
    ]);
    userToken = userRes.body.token;
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await closeDb();
  });

  it('creates SKILL entries, filters ?type=SKILL, and analyzes SKILL.md via /api/ai/analyze', async () => {
    const app = createApp();

    const listSeededSkills = await request(app).get('/api/entries?type=SKILL');
    expect(listSeededSkills.status).toBe(200);
    expect(listSeededSkills.body.data.length).toBeGreaterThanOrEqual(3);
    expect(
      listSeededSkills.body.data.every(
        (item: { entryType: string }) => item.entryType === 'SKILL',
      ),
    ).toBe(true);

    const created = await request(app)
      .post('/api/entries')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'API Schema Reviewer Skill',
        entryType: 'SKILL',
        language: 'markdown',
        description: 'SKILL.md workflow for auditing OpenAPI and Zod contracts.',
        content: `---\nname: api-schema-reviewer\ndescription: Audit Zod validators against REST routes\n---\n\n1. Check every controller uses validateBody\n2. Verify 422 envelope shapes`,
        visibility: 'PUBLIC',
        tags: ['skill-md', 'zod'],
      });

    expect(created.status).toBe(201);
    expect(created.body.entry.entryType).toBe('SKILL');

    const aiRes = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        mode: 'suggest-tags',
        entryType: 'SKILL',
        language: 'markdown',
        title: 'API Schema Reviewer Skill',
        content: created.body.entry.content,
      });
    expect(aiRes.status).toBe(200);
    expect(aiRes.body.analysis.suggestedTags).toContain('skill-md');
  });

  it('serves public curated harness skills and enforces ADMIN RBAC on mutations', async () => {
    const app = createApp();

    const publicList = await request(app).get('/api/curated-skills');
    expect(publicList.status).toBe(200);
    expect(publicList.body.skills.length).toBeGreaterThanOrEqual(6);
    expect(publicList.body.skills[0]).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String),
      slug: expect.any(String),
      harness: expect.any(String),
      repoUrl: expect.stringMatching(/^https?:\/\//),
      skillMdContent: expect.any(String),
    });

    const filtered = await request(app).get('/api/curated-skills?harness=Claude');
    expect(filtered.status).toBe(200);
    expect(filtered.body.skills.length).toBeGreaterThanOrEqual(1);

    const guestCreate = await request(app).post('/api/curated-skills').send({
      title: 'Guest Attempt',
      harness: 'Claude Code',
      category: 'Testing',
      description: 'Should be blocked with 401',
      repoUrl: 'https://github.com/example/skill',
      skillMdContent: '---\nname: test\n---\nInstructions',
    });
    expect(guestCreate.status).toBe(401);

    const userCreate = await request(app)
      .post('/api/curated-skills')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'User Attempt',
        harness: 'Claude Code',
        category: 'Testing',
        description: 'Should be blocked with 403',
        repoUrl: 'https://github.com/example/skill',
        skillMdContent: '---\nname: test\n---\nInstructions',
      });
    expect(userCreate.status).toBe(403);

    const badUrl = await request(app)
      .post('/api/curated-skills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Invalid URL Skill',
        harness: 'MCP',
        category: 'Docs',
        description: 'Invalid URL format should fail 422',
        repoUrl: 'not-a-valid-url',
        skillMdContent: '---\nname: bad\n---\nBody',
      });
    expect(badUrl.status).toBe(422);

    const created = await request(app)
      .post('/api/curated-skills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Systematic Codebase Mapper',
        harness: 'Claude Code / Codex',
        category: 'Architecture',
        description: 'Produces dependency maps before refactoring modules.',
        repoUrl: 'https://github.com/modelcontextprotocol/servers',
        docsUrl: 'https://modelcontextprotocol.io/introduction',
        installCommand: 'npx skills add example/codebase-mapper',
        skillMdContent:
          '---\nname: codebase-mapper\ndescription: Map module dependencies safely\n---\n\n1. Inspect exports\n2. Output graph',
        tags: ['architecture', 'skill-md'],
        isFeatured: true,
      });
    expect(created.status).toBe(201);
    expect(created.body.skill.slug).toBe('systematic-codebase-mapper');

    const skillId = created.body.skill.id as number;

    const updated = await request(app)
      .patch(`/api/curated-skills/${skillId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isFeatured: false, harness: 'Universal SKILL.md' });
    expect(updated.status).toBe(200);
    expect(updated.body.skill.isFeatured).toBe(false);
    expect(updated.body.skill.harness).toBe('Universal SKILL.md');

    const deleted = await request(app)
      .delete(`/api/curated-skills/${skillId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(204);
  });
});
