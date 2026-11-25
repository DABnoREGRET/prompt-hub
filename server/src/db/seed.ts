import path from 'node:path';
import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import { closeDb, DbClient, getDb } from './client.js';
import { runMigrations } from './migrate.js';

interface SeedEntry {
  title: string;
  authorEmail: string;
  categorySlug: string;
  entryType: 'SNIPPET' | 'PROMPT';
  language: string;
  description: string;
  content: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  tags: string[];
}

const SEED_CATEGORIES = [
  {
    name: 'Backend API',
    slug: 'backend-api',
    description: 'Express middleware, validation, and REST controller patterns.',
  },
  {
    name: 'React & UI',
    slug: 'react-ui',
    description: 'Reusable hooks, accessible components, and Tailwind patterns.',
  },
  {
    name: 'SQL & Data',
    slug: 'sql-data',
    description: 'PostgreSQL indexing, aggregations, and query tuning.',
  },
  {
    name: 'AI System Prompts',
    slug: 'ai-system-prompts',
    description: 'Parameterized {{variable}} prompts for coding and debugging.',
  },
  {
    name: 'DevOps & CI',
    slug: 'devops-ci',
    description: 'GitHub Actions pipelines, Dockerfiles, and deployment configs.',
  },
  {
    name: 'Testing & QA',
    slug: 'testing-qa',
    description: 'Vitest, Supertest, and React Testing Library blueprints.',
  },
];

const SEED_TAGS = [
  'typescript',
  'express',
  'react',
  'postgres',
  'tailwind',
  'zod',
  'code-review',
  'sql-tuning',
  'docker',
  'testing',
  'refactoring',
  'api-design',
];

const SEED_ENTRIES: SeedEntry[] = [
  {
    title: 'Express Zod Request Body Validator',
    authorEmail: 'dab@prompthub.dev',
    categorySlug: 'backend-api',
    entryType: 'SNIPPET',
    language: 'typescript',
    description: 'Validates req.body with Zod and returns a uniform 422 envelope.',
    content: `export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    req.body = parsed.data;
    return next();
  };
}`,
    visibility: 'PUBLIC',
    tags: ['typescript', 'express', 'zod', 'api-design'],
  },
  {
    title: 'Senior Code Review Prompt Template',
    authorEmail: 'dab@prompthub.dev',
    categorySlug: 'ai-system-prompts',
    entryType: 'PROMPT',
    language: 'markdown',
    description: 'Structured pull request reviewer checking correctness, security, and edge cases.',
    content: `You are a senior {{language}} engineer reviewing a pull request for {{project_name}}.
Analyze the diff below for:
1. Security vulnerabilities or missing input validation
2. N+1 database queries or unhandled async errors
3. Missing unit/integration test coverage

Focus area: {{focus_area}}
Diff:
{{code_diff}}`,
    visibility: 'PUBLIC',
    tags: ['code-review', 'refactoring'],
  },
  {
    title: 'Debounced Search Input Hook in React',
    authorEmail: 'phan@prompthub.dev',
    categorySlug: 'react-ui',
    entryType: 'SNIPPET',
    language: 'typescript',
    description: 'Lightweight custom hook to debounce filter inputs before API calls.',
    content: `import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}`,
    visibility: 'PUBLIC',
    tags: ['react', 'typescript'],
  },
  {
    title: 'PostgreSQL Popular Entries Aggregation Query',
    authorEmail: 'dab@prompthub.dev',
    categorySlug: 'sql-data',
    entryType: 'SNIPPET',
    language: 'sql',
    description: 'Fetches public entries with author, category, and live bookmark counts.',
    content: `SELECT e.id, e.title, e.entry_type, e.language,
       u.username AS author_name,
       c.name AS category_name,
       COUNT(b.user_id)::int AS bookmark_count
FROM entries e
JOIN users u ON u.id = e.author_id
LEFT JOIN categories c ON c.id = e.category_id
LEFT JOIN bookmarks b ON b.entry_id = e.id
WHERE e.visibility = 'PUBLIC'
GROUP BY e.id, u.username, c.name
ORDER BY bookmark_count DESC, e.created_at DESC
LIMIT $1 OFFSET $2;`,
    visibility: 'PUBLIC',
    tags: ['postgres', 'sql-tuning'],
  },
  {
    title: 'SQL Query Optimization & Index Advisor Prompt',
    authorEmail: 'dab@prompthub.dev',
    categorySlug: 'ai-system-prompts',
    entryType: 'PROMPT',
    language: 'markdown',
    description: 'Analyzes slow PostgreSQL queries and recommends composite indexes.',
    content: `Act as a PostgreSQL 16 database performance engineer.
Given table schema:
{{table_schema}}

And slow query:
{{sql_query}}

1. Identify full-table scans or suboptimal joins.
2. Propose exact CREATE INDEX statements and explain why column order matters.
3. Provide a rewritten query if applicable.`,
    visibility: 'PUBLIC',
    tags: ['postgres', 'sql-tuning'],
  },
  {
    title: 'Node.js CI Pipeline for GitHub Actions',
    authorEmail: 'admin@prompthub.dev',
    categorySlug: 'devops-ci',
    entryType: 'SNIPPET',
    language: 'yaml',
    description: 'Runs lint, typecheck, tests, and production build on pull requests.',
    content: `name: CI
on: [pull_request, push]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck && npm test && npm run build`,
    visibility: 'PUBLIC',
    tags: ['testing'],
  },
  {
    title: 'Supertest API Integration Harness with PGlite',
    authorEmail: 'dab@prompthub.dev',
    categorySlug: 'testing-qa',
    entryType: 'SNIPPET',
    language: 'typescript',
    description: 'Spins up an isolated in-memory PostgreSQL instance per test file.',
    content: `beforeAll(async () => {
  const db = createPgliteClient('memory://');
  setDbForTests(db);
  await runMigrations(db);
  await seedDatabase(db);
});`,
    visibility: 'PUBLIC',
    tags: ['testing', 'postgres', 'typescript'],
  },
  {
    title: 'API Contract & OpenAPI Spec Generator Prompt',
    authorEmail: 'dab@prompthub.dev',
    categorySlug: 'ai-system-prompts',
    entryType: 'PROMPT',
    language: 'markdown',
    description: 'Generates consistent REST endpoint specs and Zod schemas from requirements.',
    content: `Design a REST API contract for {{resource_name}} in {{framework}}.
Requirements:
{{requirements}}

Output:
1. Endpoint table (Method, Path, Auth Role, Status Codes)
2. Zod validation schema for request payloads
3. Standardized error response examples`,
    visibility: 'PUBLIC',
    tags: ['api-design', 'zod'],
  },
  {
    title: 'Accessible Modal Dialog with Escape Key Handler',
    authorEmail: 'phan@prompthub.dev',
    categorySlug: 'react-ui',
    entryType: 'SNIPPET',
    language: 'typescript',
    description: 'Keyboard-accessible confirmation modal for destructive actions.',
    content: `useEffect(() => {
  if (!isOpen) return;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}, [isOpen, onClose]);`,
    visibility: 'PUBLIC',
    tags: ['react', 'tailwind', 'typescript'],
  },
  {
    title: 'Unit Test Edge-Case Generator Prompt',
    authorEmail: 'phan@prompthub.dev',
    categorySlug: 'ai-system-prompts',
    entryType: 'PROMPT',
    language: 'markdown',
    description: 'Produces boundary and negative test cases for TypeScript functions.',
    content: `Write {{test_framework}} unit tests for the following {{language}} function.
Include happy paths, boundary conditions, null/empty inputs, and authorization failures.

Function:
{{source_code}}`,
    visibility: 'PUBLIC',
    tags: ['testing', 'typescript'],
  },
  {
    title: 'Express Parameterized Transaction Helper',
    authorEmail: 'dab@prompthub.dev',
    categorySlug: 'backend-api',
    entryType: 'SNIPPET',
    language: 'typescript',
    description: 'Rolls back database transactions automatically when async callbacks throw.',
    content: `await db.transaction(async (tx) => {
  const { rows } = await tx.query('INSERT INTO entries (...) VALUES (...) RETURNING id', values);
  await syncEntryTags(tx, rows[0].id, tags);
});`,
    visibility: 'PUBLIC',
    tags: ['express', 'postgres', 'typescript'],
  },
  {
    title: 'Legacy Function Refactoring Prompt',
    authorEmail: 'admin@prompthub.dev',
    categorySlug: 'ai-system-prompts',
    entryType: 'PROMPT',
    language: 'markdown',
    description: 'Guides safe decomposition of deeply nested functions using early returns.',
    content: `Refactor the {{language}} module below to reduce nesting depth below 3 levels.
Constraints:
- Preserve exact observable behavior and error codes
- Extract pure helper functions where duplicated logic appears
- Target style: {{style_guide}}

Code:
{{code_block}}`,
    visibility: 'PUBLIC',
    tags: ['refactoring', 'code-review'],
  },
  {
    title: 'Multi-Stage Production Dockerfile for Node API',
    authorEmail: 'admin@prompthub.dev',
    categorySlug: 'devops-ci',
    entryType: 'SNIPPET',
    language: 'dockerfile',
    description: 'Minimal Node 22 Alpine container building TypeScript cleanly.',
    content: `FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev
CMD ["node", "dist/index.js"]`,
    visibility: 'PUBLIC',
    tags: ['docker'],
  },
  {
    title: 'Private Incident Postmortem Prompt',
    authorEmail: 'dab@prompthub.dev',
    categorySlug: 'ai-system-prompts',
    entryType: 'PROMPT',
    language: 'markdown',
    description: 'Internal template for drafting blameless incident summaries.',
    content: `Summarize production incident {{incident_id}} affecting {{service_name}}.
Timeline: {{timeline_notes}}
Root cause: {{root_cause}}
Output executive summary, customer impact, and 3 concrete preventive action items.`,
    visibility: 'PRIVATE',
    tags: ['code-review'],
  },
  {
    title: 'Private Render Health Check Curl Probe',
    authorEmail: 'phan@prompthub.dev',
    categorySlug: 'devops-ci',
    entryType: 'SNIPPET',
    language: 'bash',
    description: 'Quick local smoke check for API readiness and CORS headers.',
    content: `curl -i -H "Origin: https://dabnoregret.github.io" https://prompthub-api.onrender.com/api/health`,
    visibility: 'PRIVATE',
    tags: ['api-design'],
  },
];

export async function seedDatabase(dbArg?: DbClient): Promise<void> {
  const db = dbArg ?? (await getDb());
  await runMigrations(db);

  const adminHash = await bcrypt.hash('Admin123!', 10);
  const userHash = await bcrypt.hash('PromptHub123!', 10);

  const usersToSeed = [
    {
      username: 'admin',
      email: 'admin@prompthub.dev',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
    {
      username: 'dabber',
      email: 'dab@prompthub.dev',
      passwordHash: userHash,
      role: 'USER',
    },
    {
      username: 'phananh',
      email: 'phan@prompthub.dev',
      passwordHash: userHash,
      role: 'USER',
    },
  ];

  const userIdByEmail = new Map<string, number>();
  for (const user of usersToSeed) {
    const res = await db.query<{ id: number }>(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
       RETURNING id`,
      [user.username, user.email, user.passwordHash, user.role],
    );
    userIdByEmail.set(user.email, res.rows[0].id);
  }

  const categoryIdBySlug = new Map<string, number>();
  for (const category of SEED_CATEGORIES) {
    const res = await db.query<{ id: number }>(
      `INSERT INTO categories (name, slug, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
       RETURNING id`,
      [category.name, category.slug, category.description],
    );
    categoryIdBySlug.set(category.slug, res.rows[0].id);
  }

  const tagIdByName = new Map<string, number>();
  for (const tagName of SEED_TAGS) {
    const res = await db.query<{ id: number }>(
      `INSERT INTO tags (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [tagName],
    );
    tagIdByName.set(tagName, res.rows[0].id);
  }

  const entryIds: number[] = [];
  for (const entry of SEED_ENTRIES) {
    const authorId = userIdByEmail.get(entry.authorEmail);
    const categoryId = categoryIdBySlug.get(entry.categorySlug) ?? null;
    if (!authorId) continue;

    const existing = await db.query<{ id: number }>(
      'SELECT id FROM entries WHERE author_id = $1 AND title = $2',
      [authorId, entry.title],
    );

    let entryId: number;
    if (existing.rows.length > 0) {
      entryId = existing.rows[0].id;
    } else {
      const inserted = await db.query<{ id: number }>(
        `INSERT INTO entries (
           author_id, category_id, title, entry_type, language, description, content, visibility
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          authorId,
          categoryId,
          entry.title,
          entry.entryType,
          entry.language,
          entry.description,
          entry.content,
          entry.visibility,
        ],
      );
      entryId = inserted.rows[0].id;
    }
    entryIds.push(entryId);

    for (const tagName of entry.tags) {
      const tagId = tagIdByName.get(tagName);
      if (tagId) {
        await db.query(
          `INSERT INTO entry_tags (entry_id, tag_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [entryId, tagId],
        );
      }
    }
  }

  const dabId = userIdByEmail.get('dab@prompthub.dev');
  const phanId = userIdByEmail.get('phan@prompthub.dev');
  if (dabId && entryIds.length >= 4) {
    for (const idx of [0, 1, 2, 3]) {
      await db.query(
        'INSERT INTO bookmarks (user_id, entry_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [dabId, entryIds[idx]],
      );
    }
  }
  if (phanId && entryIds.length >= 5) {
    for (const idx of [0, 1, 4]) {
      await db.query(
        'INSERT INTO bookmarks (user_id, entry_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [phanId, entryIds[idx]],
      );
    }
  }
}

const isEntryPoint =
  Boolean(process.argv[1]) &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isEntryPoint) {
  seedDatabase()
    .then(async () => {
      console.log('Seeded Prompt Hub database successfully.');
      await closeDb();
    })
    .catch(async (err) => {
      console.error('Seed failed:', err);
      await closeDb();
      process.exit(1);
    });
}
