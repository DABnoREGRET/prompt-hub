import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { closeDb, createPgliteClient, DbClient, setDbForTests } from '../src/db/client.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seed.js';
import { authenticate, requireRole } from '../src/middlewares/auth.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';

describe('Auth API & RBAC Middleware', () => {
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

  it('registers a new USER, hashes password, and omits password_hash in response', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/register').send({
      username: 'son_dev',
      email: 'Son.Dev@PromptHub.dev',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({
      username: 'son_dev',
      email: 'son.dev@prompthub.dev',
      role: 'USER',
      isActive: true,
    });
    expect(res.body.user.password_hash).toBeUndefined();
    expect(res.body.user.passwordHash).toBeUndefined();

    const stored = await db.query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE email = $1',
      ['son.dev@prompthub.dev'],
    );
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0].password_hash).not.toBe('Password123!');
  });

  it('rejects duplicate email with 409 EMAIL_TAKEN and duplicate username with 409 USERNAME_TAKEN', async () => {
    const app = createApp();

    const dupEmail = await request(app).post('/api/auth/register').send({
      username: 'another_name',
      email: 'DAB@prompthub.dev',
      password: 'Password123!',
    });
    expect(dupEmail.status).toBe(409);
    expect(dupEmail.body.error.code).toBe('EMAIL_TAKEN');

    const dupUsername = await request(app).post('/api/auth/register').send({
      username: 'dabber',
      email: 'unique_email@prompthub.dev',
      password: 'Password123!',
    });
    expect(dupUsername.status).toBe(409);
    expect(dupUsername.body.error.code).toBe('USERNAME_TAKEN');
  });

  it('rejects malformed registration payloads with 422 VALIDATION_ERROR', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/register').send({
      username: 'x',
      email: 'not-an-email',
      password: 'onlyletters',
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.username).toBeDefined();
    expect(res.body.error.details.email).toBeDefined();
    expect(res.body.error.details.password).toBeDefined();
  });

  it('logs in seeded user and returns JWT + user profile', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/login').send({
      email: 'dab@prompthub.dev',
      password: 'PromptHub123!',
    });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({
      username: 'dabber',
      email: 'dab@prompthub.dev',
      role: 'USER',
    });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('rejects invalid credentials with 401 INVALID_CREDENTIALS', async () => {
    const app = createApp();

    const wrongPass = await request(app).post('/api/auth/login').send({
      email: 'dab@prompthub.dev',
      password: 'WrongPassword1',
    });
    expect(wrongPass.status).toBe(401);
    expect(wrongPass.body.error.code).toBe('INVALID_CREDENTIALS');

    const unknownUser = await request(app).post('/api/auth/login').send({
      email: 'nobody@prompthub.dev',
      password: 'Password123!',
    });
    expect(unknownUser.status).toBe(401);
    expect(unknownUser.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 200 for GET /api/auth/me with valid token and 401 without token', async () => {
    const app = createApp();

    const unauth = await request(app).get('/api/auth/me');
    expect(unauth.status).toBe(401);
    expect(unauth.body.error.code).toBe('UNAUTHORIZED');

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'phan@prompthub.dev',
      password: 'PromptHub123!',
    });
    const token = loginRes.body.token as string;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user).toMatchObject({
      username: 'phananh',
      email: 'phan@prompthub.dev',
      role: 'USER',
    });
  });

  it('handles POST /api/auth/logout with token guard', async () => {
    const app = createApp();

    const unauth = await request(app).post('/api/auth/logout');
    expect(unauth.status).toBe(401);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'dab@prompthub.dev',
      password: 'PromptHub123!',
    });
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ loggedOut: true });
  });

  it('blocks deactivated accounts with 403 ACCOUNT_DEACTIVATED on login and /me', async () => {
    const app = createApp();

    const created = await request(app).post('/api/auth/register').send({
      username: 'inactive_user',
      email: 'inactive@prompthub.dev',
      password: 'Password123!',
    });
    expect(created.status).toBe(201);
    const token = created.body.token as string;

    await db.query('UPDATE users SET is_active = FALSE WHERE email = $1', [
      'inactive@prompthub.dev',
    ]);

    const loginBlocked = await request(app).post('/api/auth/login').send({
      email: 'inactive@prompthub.dev',
      password: 'Password123!',
    });
    expect(loginBlocked.status).toBe(403);
    expect(loginBlocked.body.error.code).toBe('ACCOUNT_DEACTIVATED');

    const meBlocked = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meBlocked.status).toBe(403);
    expect(meBlocked.body.error.code).toBe('ACCOUNT_DEACTIVATED');
  });

  it('enforces requireRole("ADMIN") middleware (403 for USER, 200 for ADMIN)', async () => {
    const app = createApp();

    const userLogin = await request(app).post('/api/auth/login').send({
      email: 'dab@prompthub.dev',
      password: 'PromptHub123!',
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@prompthub.dev',
      password: 'Admin123!',
    });

    const rbacApp = express();
    rbacApp.get(
      '/rbac-admin-probe',
      authenticate,
      requireRole('ADMIN'),
      (_req, res) => res.status(200).json({ ok: true }),
    );
    rbacApp.use(errorHandler);

    const userProbe = await request(rbacApp)
      .get('/rbac-admin-probe')
      .set('Authorization', `Bearer ${userLogin.body.token}`);
    expect(userProbe.status).toBe(403);
    expect(userProbe.body.error.code).toBe('FORBIDDEN');

    const adminProbe = await request(rbacApp)
      .get('/rbac-admin-probe')
      .set('Authorization', `Bearer ${adminLogin.body.token}`);
    expect(adminProbe.status).toBe(200);
    expect(adminProbe.body).toEqual({ ok: true });
  });
});
