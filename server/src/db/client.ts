import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { env } from '../config/env.js';

export interface QueryResultRow {
  [column: string]: unknown;
}

export interface QueryResult<R extends QueryResultRow = QueryResultRow> {
  rows: R[];
  rowCount: number;
}

export interface DbClient {
  query<R extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<R>>;
  exec(sql: string): Promise<void>;
  transaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/** Determines whether PostgreSQL connections should enable TLS (external Render hosts or sslmode=require). */
export function shouldUseSsl(connectionString: string): boolean {
  if (process.env.DB_SSL === 'true') return true;
  if (process.env.DB_SSL === 'false') return false;
  return (
    connectionString.includes('.render.com') ||
    connectionString.includes('sslmode=require')
  );
}

export function createPgliteClient(dataDir?: string): DbClient {
  const isMemory = !dataDir || dataDir === 'memory://';
  if (!isMemory) {
    fs.mkdirSync(path.resolve(dataDir), { recursive: true });
  }

  const pglite = isMemory ? new PGlite() : new PGlite(path.resolve(dataDir));
  let txQueue: Promise<unknown> = Promise.resolve();

  const client: DbClient = {
    async query<R extends QueryResultRow = QueryResultRow>(
      sql: string,
      params: unknown[] = [],
    ): Promise<QueryResult<R>> {
      const result = await pglite.query<R>(sql, params);
      return {
        rows: result.rows,
        rowCount: result.affectedRows ?? result.rows.length,
      };
    },
    async exec(sql: string): Promise<void> {
      await pglite.exec(sql);
    },
    async transaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
      // PGlite executes on a single connection; serialize transactions to avoid nested BEGIN conflicts.
      const run = async () => {
        await pglite.exec('BEGIN');
        try {
          const out = await fn(client);
          await pglite.exec('COMMIT');
          return out;
        } catch (err) {
          await pglite.exec('ROLLBACK');
          throw err;
        }
      };

      const next = txQueue.then(run, run);
      txQueue = next.then(
        () => undefined,
        () => undefined,
      );
      return next;
    },
    async close(): Promise<void> {
      await pglite.close();
    },
  };

  return client;
}

export function createPgPoolClient(connectionString: string): DbClient {
  const pool = new pg.Pool({
    connectionString,
    ssl: shouldUseSsl(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
  });

  const wrapRunner = (runner: pg.Pool | pg.PoolClient): DbClient => ({
    async query<R extends QueryResultRow = QueryResultRow>(
      sql: string,
      params: unknown[] = [],
    ): Promise<QueryResult<R>> {
      const result = await runner.query<R>(sql, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount ?? result.rows.length,
      };
    },
    async exec(sql: string): Promise<void> {
      await runner.query(sql);
    },
    async transaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
      const pgClient = await pool.connect();
      try {
        await pgClient.query('BEGIN');
        const out = await fn(wrapRunner(pgClient));
        await pgClient.query('COMMIT');
        return out;
      } catch (err) {
        await pgClient.query('ROLLBACK');
        throw err;
      } finally {
        pgClient.release();
      }
    },
    async close(): Promise<void> {
      await pool.end();
    },
  });

  return wrapRunner(pool);
}

let activeDb: DbClient | null = null;

export async function getDb(): Promise<DbClient> {
  if (activeDb) {
    return activeDb;
  }

  if (env.USE_PGLITE) {
    activeDb = createPgliteClient(env.PGLITE_DATA_DIR);
  } else {
    activeDb = createPgPoolClient(env.DATABASE_URL);
  }

  return activeDb;
}

export function setDbForTests(client: DbClient | null): void {
  activeDb = client;
}

export async function closeDb(): Promise<void> {
  if (activeDb) {
    const target = activeDb;
    activeDb = null;
    await target.close();
  }
}
