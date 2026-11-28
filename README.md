# Prompt Hub — Code Snippets, AI Prompts & `SKILL.md` Vault

A collaborative developer vault to store, categorize, search, test, and share reusable code snippets (`SNIPPET`), parameterized `{{variable}}` AI prompts (`PROMPT`), copy-paste `SKILL.md` agent workflows (`SKILL`), and curated plugins for AI coding harnesses.

## Features

- **Dark & Light Studio Themes**: Built with dual evening dark (`#0f1f10` + `#c6f19d` accent) and crisp light studio grades powered by `Funnel Display`, `Funnel Sans`, and `DM Mono` with persisted preference.
- **Role-Based Access Control**: Supports `GUEST` (public explore, prompt playground, and curated skills directory), `USER` (create/edit/delete own entries, `SKILL.md` workflows, private vault, bookmarks, AI assistant), and `ADMIN` (curated AI harness skills registry management, category CRUD, moderation).
- **`SKILL.md` Vault & One-Click Copy/Download**: Author YAML-frontmatter `SKILL.md` files using a built-in template inserter and copy or download `SKILL.md` directly into Claude Code, Codex, Cursor, or OpenHands workspaces.
- **Curated AI Harness Skills Directory (`/skills`)**: Public catalog maintained by Admins via `/admin` featuring popular MCP plugins and agent skill repositories, CLI install commands, documentation links, and `SKILL.md` starters.
- **Interactive Prompt Playground & AI Vault Assistant**: Live `{{variable}}` substitution preview plus `/api/ai/analyze` (`explain`, `improve`, `suggest-tags`) with Google Gemini integration and deterministic heuristic fallback.

## Tech Stack

| Layer | Technology | Hosting |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, React Router (`HashRouter`), Zod | GitHub Pages |
| **Backend** | Node.js 22, Express, TypeScript, Zod, `bcryptjs`, `jsonwebtoken` | Render Web Service |
| **Database** | PostgreSQL 16 (`pg` in prod; `@electric-sql/pglite` zero-config fallback locally) | Render PostgreSQL |
| **Testing & CI** | Vitest, Supertest, React Testing Library, GitHub Actions | GitHub Actions |

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** `>= 20` (tested on `v22+`) and **npm** `>= 10`
- *(Optional)* PostgreSQL 16 if setting `USE_PGLITE=false`; by default `USE_PGLITE=true` runs embedded PostgreSQL locally with zero external setup.

### 2. Clone & Install
```bash
git clone https://github.com/DABnoREGRET/prompt-hub.git
cd prompt-hub
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```
Review `.env` (see [`.env.example`](./.env.example) for descriptions). No real secrets are required for local development when `USE_PGLITE=true`.

### 4. Initialize Database & Seed Demo Data
```bash
npm run db:migrate
npm run db:seed
```

**Seeded Demo Accounts:**
| Role | Email | Password |
|---|---|---|
| `ADMIN` | `admin@prompthub.dev` | `Admin123!` |
| `USER` | `dab@prompthub.dev` | `PromptHub123!` |
| `USER` | `son@prompthub.dev` | `PromptHub123!` |
| `USER` | `phan@prompthub.dev` | `PromptHub123!` |

### 5. Run Frontend & Backend
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api` (`GET /api/health`, `GET /api/curated-skills`)

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Run client and server concurrently in watch mode |
| `npm run db:migrate` | Apply PostgreSQL schema migrations |
| `npm run db:seed` | Seed demo users, categories, tags, entries, and curated harness skills |
| `npm test` | Run backend integration tests and frontend component tests |
| `npm run lint` | Lint client and server codebases |
| `npm run typecheck` | Run TypeScript type checking across workspaces |
| `npm run build` | Build production bundles for client and server |

## Documentation

- [Capability Map](./CAPABILITY_MAP.md)
- [V1 Technical Specification](./SPEC.md)
- [Functional Specification](./FUNCTIONAL_SPECIFICATION.md)
- [Implementation & Deployment Guide](./IMPLEMENTATION_GUIDE.md)
- [Database Schema & ERD](./docs/DATABASE_SCHEMA.md)
- [Architecture Decision Records](./docs/decisions/)

## Team & Module Ownership

| Member | GitHub | Role & Owned Modules |
|---|---|---|
| **Dabber** | `@DABnoREGRET` | Project Manager & Tech Lead — DB foundation, Entries CRUD & search API, Detail/Prompt Playground & Editor, AI Assistant, CI/CD & Cloud Deployment |
| **Son Pham** | `@SonPham15` | Backend Engineer — Authentication (`bcryptjs` + JWT), RBAC middleware, Categories/Tags & Curated Skills API, Admin moderation API & security hardening |
| **Nguyễn Phan Anh** | `@phanh1475` | Frontend Engineer — React/Tailwind app shell, Dark Mode studio UI overhaul, `SKILL.md` UX, Curated Skills Directory & Admin Curator UI |
