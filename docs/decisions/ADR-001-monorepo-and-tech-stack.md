# ADR-001: Monorepo Workspaces and React + Express TypeScript Stack

## Status
Accepted

## Date
2026-11-25

## Context
Prompt Hub requires a React single-page frontend hosted on GitHub Pages, a Node.js REST API hosted on Render, and a shared relational database. A 3-person team working over a 1-week sprint needs fast local startup, consistent TypeScript conventions, and isolated CI checks without coordinating across multiple Git repositories.

## Decision
Use a single **npm workspaces** monorepo containing `client/` (React 19, TypeScript, Vite, Tailwind CSS, React Router) and `server/` (Node.js 22, Express, TypeScript, Zod), with root scripts orchestrating lint, typecheck, test, and build across both packages.

## Alternatives Considered

### Two Separate Repositories (`prompthub-web` and `prompthub-api`)
- Pros: Independent CI triggers per repo.
- Cons: Doubles PR coordination overhead for a 1-week sprint, splits documentation/ERD out of sync with code, and complicates end-to-end onboarding for reviewers cloning the project.
- Rejected: Higher coordination friction with no benefit for a 3-developer team.

### Next.js Full-Stack Monolith
- Pros: Unified routing and server actions.
- Cons: Next.js SSR features cannot deploy to static GitHub Pages without losing server routes, and couples UI and API instead of exposing a clean layered Express REST API (`routes / controllers / services / models`).
- Rejected: Incompatible with the static GitHub Pages + separate Render Node.js REST API architecture.

## Consequences
- Single `git clone` + `npm install` + `npm run dev` boots the entire full-stack environment.
- `client/` builds to static assets (`client/dist`) deployable directly to GitHub Pages, while `server/` builds independently for Render.
- Shared documentation (`SPEC.md`, `CAPABILITY_MAP.md`, `docs/`) stays versioned alongside every feature PR.
