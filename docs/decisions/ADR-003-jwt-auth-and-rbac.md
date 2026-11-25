# ADR-003: Bearer JWT Authentication and Server-Side RBAC over Cross-Origin Cookies

## Status
Accepted

## Date
2026-11-25

## Context
Prompt Hub's frontend is hosted on **GitHub Pages** (`https://<user>.github.io`) while the backend API runs on **Render** (`https://<service>.onrender.com`). These are distinct top-level sites (cross-site requests). Modern browsers (Safari ITP, Chrome third-party cookie restrictions) block or drop `SameSite=Lax`/`Strict` cookies across separate origins, and `SameSite=None; Secure` requires careful domain alignment that frequently breaks on public `.github.io` / `.onrender.com` suffixes.

## Decision
Authenticate API requests using stateless **JSON Web Tokens (`jsonwebtoken`)** passed via `Authorization: Bearer <token>` headers, backed by `bcryptjs` (cost factor 10) password hashing and strict server-side RBAC middlewares (`authenticate`, `optionalAuth`, `requireRole('ADMIN')`).

## Alternatives Considered

### Express Session Cookies (`express-session`)
- Pros: Server-side session revocation without token blacklists.
- Cons: Cross-site cookie blocking between `github.io` and `onrender.com` breaks login persistence in standard browser configurations; requires sticky session store (`connect-pg-simple`).
- Rejected: Unreliable across GitHub Pages and Render free-tier domains.

## Consequences
- Cross-origin requests from GitHub Pages to Render succeed reliably across all browsers when paired with explicit `CORS_ORIGIN` configuration.
- `users.is_active` is checked on `/api/auth/login` and `/api/auth/me` (and protected mutations) so deactivated users cannot continue using active accounts.
- Token expiry (`JWT_EXPIRES_IN=7d`), `helmet` security headers, and `express-rate-limit` on `/api/auth/*` mitigate brute-force and header tampering risks.
