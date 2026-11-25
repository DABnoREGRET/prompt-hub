import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../.env'),
];

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

function parseOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  USE_PGLITE: process.env.USE_PGLITE !== 'false',
  PGLITE_DATA_DIR: process.env.PGLITE_DATA_DIR || './data/pglite',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/prompthub',
  JWT_SECRET:
    process.env.JWT_SECRET || 'dev-only-change-me-in-production-32-chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGINS: parseOrigins(
    process.env.CORS_ORIGIN || 'http://localhost:5173',
  ),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  AUTO_MIGRATE: process.env.AUTO_MIGRATE !== 'false',
};
