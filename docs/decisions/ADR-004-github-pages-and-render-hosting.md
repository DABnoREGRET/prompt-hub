# ADR-004: Static GitHub Pages Frontend and Render Blueprint Backend Hosting

## Status
Accepted

## Date
2026-11-25

## Context
Prompt Hub must be publicly accessible online with zero hosting cost while maintaining clean separation between the React SPA and the Node.js + PostgreSQL backend.

## Decision
1. **Frontend on GitHub Pages**: Build `client/` via GitHub Actions (`.github/workflows/deploy-pages.yml`) with `VITE_BASE_PATH=/prompt-hub/` and deploy via `actions/deploy-pages@v4`. Use `HashRouter` in React Router so client-side deep links (e.g., `/#/entries/5`, `/#/vault`) never trigger GitHub Pages `404` responses on refresh.
2. **Backend & DB on Render**: Define both the Node.js Web Service (`prompthub-api`) and Managed PostgreSQL (`prompthub-db`) declaratively in `render.yaml`, exposing `/api/health` for Render health checks and frontend cold-start readiness probes.

## Alternatives Considered

### BrowserRouter + `404.html` Hack on GitHub Pages
- Pros: Clean path URLs without `#`.
- Cons: GitHub Pages still logs HTTP `404` network errors on hard refreshes and breaks relative asset loading for nested paths unless carefully rewritten.
- Rejected: `HashRouter` is deterministic and works identically on localhost and `/prompt-hub/` subpaths.

### Hosting Frontend & Backend Together on a Single Render Instance
- Pros: Same-origin requests.
- Cons: Misses the explicit requirement to host the frontend on GitHub Pages and Render as the backend.
- Rejected.

## Consequences
- Frontend updates deploy automatically on merges to `main` via GitHub Actions.
- Render free-tier web services sleep after 15 minutes of inactivity; `apiClient.ts` handles slow initial responses gracefully with a non-blocking "Waking up API server..." indicator.
