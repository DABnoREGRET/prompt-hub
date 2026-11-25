# Presentation Outline & Speaker Notes — Prompt Hub

Target deliverable: 5-slide presentation deck (`docs/PromptHub-Presentation.pptx`) plus individual walkthrough notes for live demonstration.

## 5-Slide Deck Structure

1. **Slide 1 — Prompt Hub: Code Snippet & AI Prompt Vault**
   - Product tagline: *Store, organize, search, and test reusable code snippets and parameterized AI prompts.*
   - Team roster & roles:
     - **Dabber** (`@DABnoREGRET`) — Project Manager & Full-Stack Tech Lead
     - **Son Pham** (`@SonPham15`) — Backend Auth, RBAC, Taxonomy & Security
     - **Nguyễn Phan Anh** (`@phanh1475`) — Frontend UI Shell, Discovery & Bookmarks
2. **Slide 2 — Work Division & Git Collaboration Workflow**
   - Capability map & feature-branch workflow (`main` protected, 12 feature PRs, cross-member code reviews, automated CI checks before merge).
   - Workload split: Dab (~59% core architecture, entries CRUD, AI assistant, CI/CD), Son (~20.5% auth, RBAC, categories, admin API), Phan (~20.5% frontend shell, search/filter/sort, bookmarks, admin UI).
3. **Slide 3 — Core Features & Role-Based Access Control**
   - Guest vs. User vs. Admin permissions matrix.
   - Full CRUD with `PUBLIC`/`PRIVATE` visibility, debounced Search + Multi-Filter + Sort + Pagination, and Interactive `{{variable}}` Prompt Playground.
   - Responsive states (`loading` skeleton, `empty` CTA, `error` retry, `success` toast).
4. **Slide 4 — Technical Architecture, Database ERD & Cloud Deployment**
   - Stack: React 19 + Vite + Tailwind (`HashRouter`) on **GitHub Pages**; Express + TypeScript + Zod on **Render Web Service**; PostgreSQL 16 (6 normalized tables: `users`, `categories`, `entries`, `tags`, `entry_tags`, `bookmarks`).
   - Key engineering choices: Cross-origin Bearer JWT ([ADR-003](./decisions/ADR-003-jwt-auth-and-rbac.md)), `pg` + `PGlite` local parity ([ADR-002](./decisions/ADR-002-postgresql-with-pglite-fallback.md)).
5. **Slide 5 — Live Demo Flow & AI Assistant Bonus**
   - End-to-end live walkthrough script + AI Snippet & Prompt Assistant (`explain`, `improve`, `suggest-tags` with Gemini API + deterministic fallback).

## Individual Member Demo & Speaking Breakdown

### 1. Dabber (`@DABnoREGRET`) — Lead Walkthrough (~3 min)
- Present system architecture (GitHub Pages ↔ Render API ↔ PostgreSQL), database ERD, and repo PR workflow.
- Demonstrate creating a new parameterized `PROMPT` entry with `{{language}}` and `{{code}}`, switching visibility (`PRIVATE` vs `PUBLIC`), running the **AI Assistant** to suggest tags and improvements, and testing live interpolation in the **Prompt Playground**.

### 2. Son Pham (`@SonPham15`) — Auth, RBAC & Admin Backend (~2 min)
- Explain registration/login (`bcryptjs` hashing + JWT signing + Zod validation) and show a live `422` validation error & `403` ownership block when attempting to edit another user's entry or hit an admin route as a regular user.
- Show Category management API + Admin user activation/deactivation endpoints and rate-limiting/helmet hardening.

### 3. Nguyễn Phan Anh (`@phanh1475`) — Frontend Shell, Search/Filter & Bookmarks (~2 min)
- Walk through Login/Register UX, `AuthContext` persistence, and responsive layout (`1440px` desktop to `375px` mobile).
- Demonstrate live Explore keyword search, Category/Type/Language filters, Sort (`popular`, `newest`, `title`), URL state sync, loading skeletons/empty states, and instant Bookmarks toggling.
