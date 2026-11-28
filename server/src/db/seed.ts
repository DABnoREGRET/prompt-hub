import path from 'node:path';
import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import { closeDb, DbClient, getDb } from './client.js';
import { runMigrations } from './migrate.js';

interface SeedEntry {
  title: string;
  authorEmail: string;
  categorySlug: string;
  entryType: 'SNIPPET' | 'PROMPT' | 'SKILL';
  language: string;
  description: string;
  content: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  tags: string[];
}

interface SeedCuratedSkill {
  title: string;
  slug: string;
  harness: string;
  category: string;
  description: string;
  repoUrl: string;
  docsUrl: string;
  installCommand: string;
  skillMdContent: string;
  tags: string[];
  isFeatured: boolean;
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
    name: 'Agent Skills',
    slug: 'agent-skills',
    description: 'Portable SKILL.md files and harness instructions ready to copy-paste.',
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
  'skill-md',
  'ai-harness',
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
    title: 'Express JWT Bearer Auth Middleware',
    authorEmail: 'son@prompthub.dev',
    categorySlug: 'backend-api',
    entryType: 'SNIPPET',
    language: 'typescript',
    description: 'Verifies Bearer JWT tokens and enforces active account status.',
    content: `export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next(AppError.unauthorized('Missing Bearer authentication token'));
  const claims = verifyAccessToken(token);
  req.user = await findPublicUserById(Number(claims.sub));
  return next();
}`,
    visibility: 'PUBLIC',
    tags: ['express', 'typescript', 'api-design'],
  },
  {
    title: 'Express Parameterized Transaction Helper',
    authorEmail: 'son@prompthub.dev',
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
    title: 'TDD Red-Green-Refactor Harness SKILL.md',
    authorEmail: 'dab@prompthub.dev',
    categorySlug: 'agent-skills',
    entryType: 'SKILL',
    language: 'markdown',
    description: 'Portable SKILL.md enforcing failing test first, minimal fix, and full suite green check.',
    content: `---
name: test-driven-development
description: Drives logic implementation and bug fixes with strict red-green-refactor verification.
---

# Test-Driven Development

## Workflow
1. Write or update a failing test first in \`tests/\` covering expected and negative edge cases.
2. Run the targeted test and observe it fail for the expected reason before editing application logic.
3. Implement the smallest clean change to make the test pass.
4. Run full \`npm run typecheck && npm test\` before reporting success.`,
    visibility: 'PUBLIC',
    tags: ['skill-md', 'ai-harness', 'testing'],
  },
  {
    title: 'REST API Boundary Security Review SKILL.md',
    authorEmail: 'son@prompthub.dev',
    categorySlug: 'agent-skills',
    entryType: 'SKILL',
    language: 'markdown',
    description: 'Security audit SKILL.md checking Zod boundary schemas, RBAC ownership, and secrets hygiene.',
    content: `---
name: api-boundary-security-audit
description: Inspects Express controllers, Zod schemas, SQL queries, and RBAC checks prior to merge.
---

# API Boundary Security Audit

## Checklist
1. Confirm every POST/PATCH endpoint runs \`validateBody\` before controller execution.
2. Confirm private resource reads and mutations verify \`authorId === req.user.id || req.user.role === 'ADMIN'\`.
3. Verify SQL statements use \`$1, $2\` positional bindings and never expose password hashes or tokens.`,
    visibility: 'PUBLIC',
    tags: ['skill-md', 'ai-harness', 'api-design'],
  },
  {
    title: 'React Accessible Component Polish SKILL.md',
    authorEmail: 'phan@prompthub.dev',
    categorySlug: 'agent-skills',
    entryType: 'SKILL',
    language: 'markdown',
    description: 'Frontend UI engineering SKILL.md covering keyboard navigation, dark/light contrast, and states.',
    content: `---
name: frontend-ui-polish
description: Audits contrast ratios, keyboard focus rings, loading/empty/error states, and mobile breakpoints.
---

# Frontend UI Polish

## Steps
1. Verify semantic landmarks (\`header\`, \`nav\`, \`main\`) and visible labels for all inputs.
2. Check body contrast (>= 7:1) and muted labels (>= 4.5:1) in both dark and light modes.
3. Verify zero horizontal overflow across 320px, 768px, and 1440px viewports.`,
    visibility: 'PUBLIC',
    tags: ['skill-md', 'ai-harness', 'react', 'tailwind'],
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

const SEED_CURATED_SKILLS: SeedCuratedSkill[] = [
  {
    title: 'Anthropic Official Agent Skills',
    slug: 'anthropic-official-agent-skills',
    harness: 'Claude Code',
    category: 'Official Registry',
    description: 'Reference repository for SKILL.md specs, document/frontend builders, and modular agent skill authoring.',
    repoUrl: 'https://github.com/anthropics/skills',
    docsUrl: 'https://agentskills.io',
    installCommand: 'npx skills add anthropics/skills',
    skillMdContent: `---
name: skill-creator
description: Create modular SKILL.md packages with crisp triggers, references, and deterministic scripts.
---

1. Define narrow trigger phrases in YAML frontmatter.
2. Keep SKILL.md instructions concise; offload deep docs into references/.`,
    tags: ['skill-md', 'ai-harness'],
    isFeatured: true,
  },
  {
    title: 'Superpowers Agentic Dev Workflow',
    slug: 'superpowers-agentic-dev-workflow',
    harness: 'Claude Code / Cursor / Codex',
    category: 'Software Workflow',
    description: 'Battle-tested planning, TDD red-green-refactor, subagent dispatch, and systematic debugging skills.',
    repoUrl: 'https://github.com/obra/superpowers',
    docsUrl: 'https://github.com/obra/superpowers#readme',
    installCommand: 'npx skills add obra/superpowers',
    skillMdContent: `---
name: systematic-debugging
description: Reproduce failure, trace root cause across boundaries, write failing regression test first.
---

1. Capture exact stack trace and environment inputs.
2. Isolate single minimal fix and verify full suite before claiming green.`,
    tags: ['testing', 'skill-md', 'ai-harness'],
    isFeatured: true,
  },
  {
    title: 'Vercel Labs Agent Skills',
    slug: 'vercel-labs-agent-skills',
    harness: 'Universal SKILL.md',
    category: 'Frontend & Web',
    description: 'Production React, Next.js composition, and web performance optimization skills via the skills CLI.',
    repoUrl: 'https://github.com/vercel-labs/agent-skills',
    docsUrl: 'https://skills.sh',
    installCommand: 'npx skills add vercel-labs/agent-skills',
    skillMdContent: `---
name: react-best-practices
description: Eliminate request waterfalls, minimize client bundle hydration, and optimize Suspense boundaries.
---

1. Parallelize independent fetches with Promise.all.
2. Keep client-only hooks isolated to leaf interactive boundaries.`,
    tags: ['react', 'typescript', 'skill-md'],
    isFeatured: true,
  },
  {
    title: 'Model Context Protocol Reference Servers',
    slug: 'mcp-reference-servers',
    harness: 'MCP Harness',
    category: 'MCP Plugins',
    description: 'Official MCP plugins giving AI harnesses structured filesystem, Git, PostgreSQL, and fetch tools.',
    repoUrl: 'https://github.com/modelcontextprotocol/servers',
    docsUrl: 'https://modelcontextprotocol.io',
    installCommand: 'npx -y @modelcontextprotocol/server-filesystem .',
    skillMdContent: `---
name: mcp-tool-routing
description: Prefer scoped read/search MCP tools before falling back to unstructured shell globs.
---

1. Inspect server schema metadata before calling lazy MCP tools.
2. Validate write boundaries against active workspace roots.`,
    tags: ['ai-harness', 'api-design'],
    isFeatured: true,
  },
  {
    title: 'Playwright Browser Automation MCP',
    slug: 'playwright-browser-mcp',
    harness: 'MCP / Browser',
    category: 'Testing & Browser QA',
    description: 'Enables AI agents to navigate, snapshot accessibility trees, and verify responsive web apps cleanly.',
    repoUrl: 'https://github.com/microsoft/playwright-mcp',
    docsUrl: 'https://github.com/microsoft/playwright-mcp#readme',
    installCommand: 'npx @playwright/mcp@latest',
    skillMdContent: `---
name: browser-verification
description: Verify rendered pages across desktop and mobile viewports using structured accessibility snapshots.
---

1. Assert zero console errors and zero failed network responses.
2. Verify horizontal overflow and keyboard focus visibility at 390px and 1440px.`,
    tags: ['testing', 'ai-harness'],
    isFeatured: true,
  },
  {
    title: 'Context7 Live Library Docs Plugin',
    slug: 'context7-live-docs-plugin',
    harness: 'MCP / Cursor / Claude',
    category: 'Documentation Retrieval',
    description: 'Injects up-to-date, version-specific framework documentation directly into your AI harness context.',
    repoUrl: 'https://github.com/upstash/context7',
    docsUrl: 'https://context7.com',
    installCommand: 'npx -y @upstash/context7-mcp',
    skillMdContent: `---
name: source-driven-docs
description: Resolve exact library IDs and query official documentation before writing version-sensitive APIs.
---

1. Resolve target package via resolve-library-id.
2. Ground implementation details strictly against retrieved official signatures.`,
    tags: ['typescript', 'ai-harness'],
    isFeatured: false,
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
      username: 'sonpham',
      email: 'son@prompthub.dev',
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

  const adminId = userIdByEmail.get('admin@prompthub.dev') ?? null;
  for (const skill of SEED_CURATED_SKILLS) {
    await db.query(
      `INSERT INTO curated_skills (
         title, slug, harness, category, description, repo_url, docs_url,
         install_command, skill_md_content, tags, is_featured, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         harness = EXCLUDED.harness,
         category = EXCLUDED.category,
         description = EXCLUDED.description,
         repo_url = EXCLUDED.repo_url,
         docs_url = EXCLUDED.docs_url,
         install_command = EXCLUDED.install_command,
         skill_md_content = EXCLUDED.skill_md_content,
         tags = EXCLUDED.tags,
         is_featured = EXCLUDED.is_featured`,
      [
        skill.title,
        skill.slug,
        skill.harness,
        skill.category,
        skill.description,
        skill.repoUrl,
        skill.docsUrl,
        skill.installCommand,
        skill.skillMdContent,
        skill.tags.join(','),
        skill.isFeatured,
        adminId,
      ],
    );
  }

  const dabId = userIdByEmail.get('dab@prompthub.dev');
  const sonId = userIdByEmail.get('son@prompthub.dev');
  const phanId = userIdByEmail.get('phan@prompthub.dev');
  if (sonId && entryIds.length >= 6) {
    for (const idx of [0, 1, 5]) {
      await db.query(
        'INSERT INTO bookmarks (user_id, entry_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [sonId, entryIds[idx]],
      );
    }
  }
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
