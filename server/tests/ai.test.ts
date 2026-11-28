import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { closeDb, createPgliteClient, setDbForTests } from '../src/db/client.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seed.js';

describe('AI Vault Assistant API (/api/ai/analyze)', () => {
  let token: string;

  beforeAll(async () => {
    const db = createPgliteClient('memory://');
    setDbForTests(db);
    await runMigrations(db);
    await seedDatabase(db);

    const app = createApp();
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'dab@prompthub.dev',
      password: 'PromptHub123!',
    });
    token = loginRes.body.token;
  });

  afterAll(async () => {
    await closeDb();
  });

  it('rejects unauthenticated requests with 401 and invalid payloads with 422', async () => {
    const app = createApp();

    const guestRes = await request(app).post('/api/ai/analyze').send({
      mode: 'explain',
      entryType: 'SNIPPET',
      language: 'typescript',
      content: 'export const add = (a: number, b: number) => a + b;',
    });
    expect(guestRes.status).toBe(401);

    const invalidRes = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mode: 'rewrite-everything',
        entryType: 'SNIPPET',
        language: 'typescript',
        content: 'short',
      });
    expect(invalidRes.status).toBe(422);
    expect(invalidRes.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns deterministic heuristic analysis for explain, improve, and suggest-tags modes', async () => {
    const app = createApp();

    const explainRes = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mode: 'explain',
        entryType: 'PROMPT',
        language: 'markdown',
        title: 'Security Reviewer',
        content:
          'You are a senior security engineer. Review {{language}} diff for {{service_name}} against OWASP Top 10 and list concrete fixes.',
      });

    expect(explainRes.status).toBe(200);
    expect(explainRes.body.analysis).toMatchObject({
      mode: 'explain',
      source: 'heuristic',
    });
    expect(explainRes.body.analysis.detectedVariables).toEqual([
      'language',
      'service_name',
    ]);
    expect(explainRes.body.analysis.summary.length).toBeGreaterThan(10);
    expect(Array.isArray(explainRes.body.analysis.suggestions)).toBe(true);
    expect(explainRes.body.analysis.suggestions.length).toBeGreaterThanOrEqual(1);

    const improveRes = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mode: 'improve',
        entryType: 'PROMPT',
        language: 'markdown',
        title: 'Quick Bug Triage',
        content: 'Analyze error log {{error_message}} for our backend service.',
      });
    expect(improveRes.status).toBe(200);
    expect(improveRes.body.analysis.improvedContent).toContain('{{error_message}}');
    expect(improveRes.body.analysis.improvedContent.length).toBeGreaterThan(60);

    const tagsRes = await request(app)
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mode: 'suggest-tags',
        entryType: 'SNIPPET',
        language: 'typescript',
        title: 'Postgres Zod Express Middleware',
        content:
          'import { z } from "zod"; export async function validateQuery(req, res, next) { next(); }',
      });
    expect(tagsRes.status).toBe(200);
    expect(tagsRes.body.analysis.suggestedTags.length).toBeGreaterThanOrEqual(2);
    expect(tagsRes.body.analysis.suggestedTags.length).toBeLessThanOrEqual(8);
    expect(tagsRes.body.analysis.suggestedTags).toContain('typescript');
  });
});
