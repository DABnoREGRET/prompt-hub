import { getDb, QueryResultRow } from '../db/client.js';
import type { UserRole } from '../utils/jwt.js';

export interface PublicUserRow extends QueryResultRow {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string | Date;
}

export interface UserRow extends PublicUserRow {
  password_hash: string;
}

export interface PublicUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export function toPublicUser(row: PublicUserRow): PublicUser {
  return {
    id: Number(row.id),
    username: String(row.username),
    email: String(row.email),
    role: row.role,
    isActive: Boolean(row.is_active),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function findUserRowByEmail(email: string): Promise<UserRow | null> {
  const db = await getDb();
  const res = await db.query<UserRow>(
    `SELECT id, username, email, password_hash, role, is_active, created_at
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email],
  );
  return res.rows[0] ?? null;
}

export async function findUserRowByUsername(
  username: string,
): Promise<Pick<UserRow, 'id' | 'username'> | null> {
  const db = await getDb();
  const res = await db.query<{ id: number; username: string }>(
    `SELECT id, username
     FROM users
     WHERE LOWER(username) = LOWER($1)
     LIMIT 1`,
    [username],
  );
  return res.rows[0] ?? null;
}

export async function findPublicUserById(id: number): Promise<PublicUser | null> {
  const db = await getDb();
  const res = await db.query<PublicUserRow>(
    `SELECT id, username, email, role, is_active, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id],
  );
  return res.rows[0] ? toPublicUser(res.rows[0]) : null;
}

export async function createUser(input: {
  username: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}): Promise<PublicUser> {
  const db = await getDb();
  const res = await db.query<PublicUserRow>(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email, role, is_active, created_at`,
    [input.username, input.email, input.passwordHash, input.role ?? 'USER'],
  );
  return toPublicUser(res.rows[0]);
}
