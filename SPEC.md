# Spec: Prompt Hub — Code Snippet & AI Prompt Vault — V1

Source capability map: [CAPABILITY_MAP.md](./CAPABILITY_MAP.md)

## Objective

Prompt Hub is a collaborative web vault for developers and technical teams to store, organize, search, test, and share reusable code snippets (`SNIPPET`) and parameterized AI prompts (`PROMPT`).

- **Guest** visitors can browse public entries, filter/search/sort the catalog, view syntax-highlighted snippets, and test `{{variable}}` prompt templates in the interactive Prompt Playground.
- **Authenticated Users (`USER`)** can create, edit, and delete their own snippets/prompts, toggle `PUBLIC`/`PRIVATE` visibility, manage personal bookmarks, and invoke the AI Snippet & Prompt Assistant.
- **Administrators (`ADMIN`)** can manage categories, moderate public entries, and view/manage user status on an Admin Dashboard.

## Tech Stack

- **Frontend (`client/`)**: React 19, TypeScript 5, Vite 6, Tailwind CSS, React Router v6 (`HashRouter` for zero-config GitHub Pages deep-link support), Zod, Vitest + React Testing Library.
- **Backend (`server/`)**: Node.js 22+, Express 4, TypeScript 5, `pg` (PostgreSQL driver for production) + `@electric-sql/pglite` (embedded PostgreSQL WASM engine for zero-dependency local dev and isolated integration tests), `bcryptjs`, `jsonwebtoken`, `zod`, `helmet`, `cors`, `express-rate-limit`, Vitest + Supertest.
- **Database**: PostgreSQL 16 (Render Managed PostgreSQL in production).
- **Hosting & CI/CD**:
  - Frontend static bundle on **GitHub Pages** via GitHub Actions (`actions/deploy-pages@v4`).
  - Backend REST API + PostgreSQL on **Render** via Infrastructure-as-Code Blueprint (`render.yaml`).

## Commands

Run from repository root (npm workspaces):

```bash
# Install all workspace dependencies
npm install

# Run database migrations and seed demo data
npm run db:migrate
npm run db:seed

# Start frontend (Vite :5173) and backend (Express :4000) concurrently in dev
npm run dev

# Run workspace unit and integration tests
npm test

# Lint and typecheck both client and server
npm run lint
npm run typecheck

# Production build for both client and server
npm run build
```

Workspace-specific commands:

```bash
npm run dev --workspace=server
npm run dev --workspace=client
npm test --workspace=server -- --coverage
npm test --workspace=client
```

## Project Structure

```text
prompt-hub/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint, typecheck, unit/integration tests, build
│       └── deploy-pages.yml       # Build client/ and deploy to GitHub Pages
├── client/                        # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── api/                   # Typed fetch client + endpoint modules
│   │   ├── components/            # Reusable UI primitives, layout, cards, playground
│   │   ├── context/               # AuthContext & ToastContext
│   │   ├── hooks/                 # Custom hooks (debounced search, entries query)
│   │   ├── pages/                 # Route views (Explore, Detail, Vault, Editor, Auth, Admin)
│   │   ├── types/                 # Shared frontend TypeScript contracts
│   │   └── validation/            # Client-side Zod schemas matching backend rules
│   └── tests/                     # Vitest + Testing Library specs
├── server/                        # Node.js + Express + TypeScript REST API
│   ├── src/
│   │   ├── config/                # Env parsing & constants
│   │   ├── controllers/           # HTTP request/response handlers
│   │   ├── db/                    # pg/PGlite pool adapter, SQL migrations, seed.ts
│   │   ├── middlewares/           # auth, role RBAC, zod validate, centralized error handler
│   │   ├── models/                # SQL query repositories
│   │   ├── routes/                # Express route definitions
│   │   ├── services/              # Business logic & AI assistant integration
│   │   └── utils/                 # Password hashing, JWT helpers, slugify, AppError
│   └── tests/                     # Supertest integration tests against PGlite
├── docs/
│   ├── DATABASE_SCHEMA.md         # ERD, DDL summary, indexes, seed inventory
│   ├── PRESENTATION_NOTES.md      # 5-slide deck outline & speaker breakdown
│   └── decisions/                 # Architecture Decision Records (ADR-001..004)
├── .env.example                   # Template environment variables (no real secrets)
├── CAPABILITY_MAP.md              # Module ownership and dependency graph
├── FUNCTIONAL_SPECIFICATION.md    # Use cases, RBAC matrix, validation, UI states
├── IMPLEMENTATION_GUIDE.md        # Architecture, build steps, Render + Pages deploy
├── README.md                      # Quick start, scripts, team ownership
├── SPEC.md                        # This V1 technical specification
├── package.json                   # Root npm workspace scripts
└── render.yaml                    # Render Web Service + PostgreSQL Blueprint
```

## Code Style

### Consistent REST Error Envelope & Boundary Validation

All API errors use a single JSON envelope (`{ error: { code, message, details? } }`). Validation executes at API boundaries via Zod middleware before entering services:

```typescript
// server/src/middlewares/validate.ts
import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
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
}
```

### Container / Presentational Split (Frontend)

Route pages manage async states (`loading`, `empty`, `error`, `success`); leaf components accept typed props and callbacks, never fetching directly inside presentational cards.

## Testing Strategy

- **Backend Integration (`server/tests/`)**: Vitest + Supertest executed against an in-memory `@electric-sql/pglite` PostgreSQL database seeded per test suite:
  - Auth flows (`register`, duplicate email `409`, `login`, `bcrypt` hash check, invalid credentials `401`, `/me` token guard).
  - RBAC & Ownership (`403` when non-owner edits/deletes another user's entry, `403` when `USER` calls `ADMIN` routes, `404`/`403` on private entries accessed by guests).
  - Entries CRUD, Search (`q`), Filters (`type`, `category`, `language`, `tag`), Sorting (`newest`, `popular`, `title`), Pagination (`page`, `pageSize`), and Bookmarks.
  - Validation rejections (`422`) and AI Assistant endpoint fallback behavior.
- **Frontend Component Tests (`client/tests/`)**: Vitest + React Testing Library verifying auth form validation, Explore filter/search state transitions, Prompt Playground `{{variable}}` live interpolation, and loading/empty/error UI rendering.

## Boundaries

- **Always:**
  - Validate inputs at both frontend forms and backend API boundaries.
  - Hash passwords with `bcryptjs` (salt rounds `>= 10`) and omit `password_hash` from all queries/responses returned to clients.
  - Enforce ownership and role checks server-side regardless of UI visibility.
  - Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before merging PRs.
- **Ask first:**
  - Altering database schema tables or column contracts after V1 freeze.
  - Introducing new heavy runtime dependencies or paid third-party APIs.
  - Changing public REST route paths or response envelope fields.
- **Never:**
  - Commit `.env` files, database credentials, JWT secrets, or API keys to Git.
  - Hardcode business records in frontend components instead of calling the REST API.
  - Trust client-supplied `userId` or `role` fields over the verified JWT payload.

## Success Criteria

- End-to-end flow operates across React frontend (GitHub Pages) → Express REST API (Render) → PostgreSQL database.
- Registration, login, logout, and persistent session restoration work with hashed passwords and JWTs.
- Full Snippet & AI Prompt CRUD (Create, List + Detail, Update, Delete) with Search, Filters, Sort, and Pagination works end-to-end.
- Role-based access control (`GUEST`, `USER`, `ADMIN`) blocks unauthorized mutations with `401`/`403`.
- Every screen renders explicit `loading`, `empty`, `error`, and `success` states cleanly on desktop (`1440px`) and mobile (`320px–768px`).
- Anyone cloning the repository can configure `.env` from `.env.example` and run locally following `README.md`.

## Out of Scope (Deferred to V2)

- **OAuth / Social Login (GitHub/Google)**: Deferred to keep V1 auth self-contained and verifiable without external OAuth app secrets.
- **Real-time Multiplayer Editing**: Deferred; V1 focuses on single-author edits and team discovery/bookmarking.
- **Version History Diff Viewer**: Deferred; V1 tracks `updated_at` timestamps on entries without storing historical snapshots.
- **IDE / Browser Extensions**: Deferred until V1 REST API stabilizes.
