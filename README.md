# Prompt Hub — Code Snippet & AI Prompt Vault

A collaborative developer vault to store, categorize, search, test, and share reusable code snippets and parameterized `{{variable}}` AI prompts.

## Features

- **Role-Based Access Control**: Supports `GUEST` (public explore + prompt playground), `USER` (create/edit/delete own entries, private vault, bookmarks, AI assistant), and `ADMIN` (category management, content moderation, user status controls).
- **Authentication & Security**: Registration, login, logout, and session persistence using `bcryptjs` password hashing, JWT Bearer authentication, Zod request validation, `helmet` security headers, and rate limiting.
- **Full CRUD & Discovery**: Create, inspect, update, and delete code snippets (`SNIPPET`) and AI prompts (`PROMPT`) with keyword search, category/type/language/tag filters, sorting (`newest`, `popular`, `title`), and pagination.
- **Interactive Prompt Playground**: Automatically detects `{{variable}}` placeholders in AI prompts and renders live input fields to preview and copy populated prompts.
- **AI Snippet & Prompt Assistant**: Generates explanations, prompt refinements, and tag suggestions via Google Gemini API (with a built-in deterministic local analyzer fallback when no API key is set).
- **Resilient UI States**: Explicit loading skeletons, actionable empty states, error retry banners, toast notifications, and mobile-first responsive layout.

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
- Backend API: `http://localhost:4000/api` (`GET /api/health`)

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Run client and server concurrently in watch mode |
| `npm run db:migrate` | Apply PostgreSQL schema migrations |
| `npm run db:seed` | Seed demo users, categories, tags, entries, and bookmarks |
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
| **Son Pham** | `@SonPham15` | Backend Engineer — Authentication (`bcryptjs` + JWT), RBAC middleware, Categories & Tags API, Admin moderation API & security hardening |
| **Nguyễn Phan Anh** | `@phanh1475` | Frontend Engineer — React/Tailwind app shell, AuthContext & Login/Register UI, Explore search/filter/sort UI, Bookmarks & Admin Dashboard UI |
