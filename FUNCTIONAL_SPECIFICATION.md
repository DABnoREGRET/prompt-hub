# Functional Specification — Prompt Hub

Reference spec: [SPEC.md](./SPEC.md)

## 1. System Overview & Actors

Prompt Hub provides a unified developer workspace for storing, categorizing, discovering, and testing reusable code snippets and parameterized AI prompts.

| Actor | Role Code | Description |
|---|---|---|
| **Guest** | `GUEST` | Unauthenticated visitor browsing public entries and testing prompt templates locally in-browser |
| **Member User** | `USER` | Registered developer who owns personal/public entries, manages bookmarks, and uses AI assistant features |
| **Administrator** | `ADMIN` | Platform moderator who manages taxonomy categories, moderates public entries, and manages user active status |

## 2. Role-Based Permissions Matrix

| Capability | Guest | User (`USER`) | Admin (`ADMIN`) |
|---|---|---|---|
| Browse, search, filter, sort public entries | Allowed | Allowed | Allowed |
| View public entry detail + copy + Prompt Playground | Allowed | Allowed | Allowed |
| Register / Login / Logout / View own profile (`/me`) | Register / Login | Logout / `/me` | Logout / `/me` |
| View private entries | Denied (`403`/`404`) | Own entries only | Own entries + moderated view |
| Create new snippet or AI prompt | Denied (`401`) | Allowed | Allowed |
| Edit or delete an entry | Denied (`401`) | Own entries only (`403` otherwise) | Any entry |
| Bookmark / unbookmark public entries | Denied (`401`) | Allowed | Allowed |
| Run AI Assistant (`/api/ai/analyze`) | Denied (`401`) | Allowed | Allowed |
| Create / update / delete Categories | Denied (`401`) | Denied (`403`) | Allowed |
| View Admin Dashboard & toggle user active status | Denied (`401`) | Denied (`403`) | Allowed |

## 3. Core Use Cases

### UC-01: User Registration, Login, Logout & Session Restore
- **Actors**: Guest, User, Admin
- **Flow**:
  1. Guest submits registration form (`username`, `email`, `password`). Frontend validates fields; backend validates with Zod, checks uniqueness (`409` on duplicate email/username), hashes password with `bcryptjs`, persists user with `USER` role, and returns `{ token, user }`.
  2. Existing user submits login (`email`, `password`). Backend verifies bcrypt hash (`401` on mismatch or deactivated account) and returns JWT + sanitized user object.
  3. Frontend persists token in `localStorage` and hydrates `AuthContext` via `GET /api/auth/me`.
  4. Logout clears local token and calls `POST /api/auth/logout` for clean session state.

### UC-02: Explore Public Vault (List, Search, Filter, Sort, Pagination)
- **Actors**: Guest, User, Admin
- **Flow**:
  1. Visitor opens Explore (`/`); frontend calls `GET /api/entries?page=1&pageSize=12&sortBy=newest`.
  2. Visitor searches by keyword (`q`, debounced 300ms) across title, description, content, and tags.
  3. Visitor filters by `type` (`SNIPPET` | `PROMPT`), `category` (slug), `language` (e.g., `typescript`, `python`, `sql`, `markdown`), or `tag`.
  4. Visitor sorts by `newest`, `popular` (bookmark count), or `title`.
  5. URL query params stay synchronized so filtered views are shareable and bookmarkable.

### UC-03: Entry Detail & Interactive Prompt Playground
- **Actors**: Guest, User, Admin
- **Flow**:
  1. Selecting any card navigates to `/entries/:id` and fetches `GET /api/entries/:id`.
  2. Syntax-formatted viewer displays code/prompt content with a one-click **Copy** button and feedback toast.
  3. If `entryType === 'PROMPT'`, the **Prompt Playground** automatically parses `{{variable_name}}` placeholders from `content`, renders dynamic inputs, and updates the live compiled prompt preview in real time for immediate copying.

### UC-04: Create Snippet or AI Prompt
- **Actors**: User, Admin
- **Flow**:
  1. Authenticated user navigates to `/new` (`New Entry`).
  2. Completes `title`, `entryType` (`SNIPPET` or `PROMPT`), `language`, `categoryId`, `visibility` (`PUBLIC` or `PRIVATE`), optional `description`, `content`, and up to 8 `tags`.
  3. Submits `POST /api/entries`; backend validates payload, upserts normalized tags inside a transaction, creates entry with `authorId = req.user.id`, and redirects to `/entries/:id`.

### UC-05: Update Own Entry
- **Actors**: Author (`USER`), Admin (`ADMIN`)
- **Flow**:
  1. Owner clicks **Edit** on `/entries/:id` → opens `/entries/:id/edit` pre-populated from API.
  2. Submits `PATCH /api/entries/:id`; backend verifies `entry.authorId === req.user.id || req.user.role === 'ADMIN'` (`403` otherwise), updates fields & tags, and returns updated record.

### UC-06: Delete Entry
- **Actors**: Author (`USER`), Admin (`ADMIN`)
- **Flow**:
  1. Owner or Admin clicks **Delete** and confirms in modal dialog.
  2. Sends `DELETE /api/entries/:id`; backend enforces ownership/admin RBAC, cascades `entry_tags` & `bookmarks`, and returns `204` or `{ deleted: true }`.

### UC-07: Personal Vault (`My Vault`)
- **Actors**: User, Admin
- **Flow**:
  1. Authenticated user visits `/vault`; frontend fetches `GET /api/entries/mine` showing both `PUBLIC` and `PRIVATE` entries authored by the user, filterable by visibility and type.

### UC-08: Bookmarks
- **Actors**: User, Admin
- **Flow**:
  1. Clicking the bookmark toggle calls `POST /api/entries/:id/bookmark` (add) or `DELETE /api/entries/:id/bookmark` (remove) with optimistic UI update and rollback on error.
  2. Visiting `/bookmarks` calls `GET /api/bookmarks` to list saved public entries.

### UC-09: Admin Category Management & Moderation
- **Actors**: Admin (`ADMIN`)
- **Flow**:
  1. Admin accesses `/admin` (non-admins redirected; API returns `403`).
  2. Admin creates/edits/deletes categories (`POST/PATCH/DELETE /api/categories`)—preventing deletion if entries still reference a category or reassigning cleanly.
  3. Admin reviews user list (`GET /api/admin/users`), activates/deactivates accounts (`PATCH /api/admin/users/:id/status`), and views vault metrics (`GET /api/admin/stats`).

### UC-10: AI Snippet & Prompt Assistant (Bonus)
- **Actors**: User, Admin
- **Flow**:
  1. In Entry Editor or Detail view, user clicks **AI Analyze** (`mode`: `explain` | `improve` | `suggest-tags`).
  2. Backend `POST /api/ai/analyze` calls Google Gemini API when `GEMINI_API_KEY` is configured, or falls back deterministically to a local static analyzer (extracting `{{variables}}`, detecting language/complexity, and proposing concise tags & summary) so the feature remains 100% functional without external quota failures.

## 4. Input Validation Rules (Frontend & Backend Parity)

| Field | Constraints | Error Code / Status |
|---|---|---|
| `username` | Required, 3–30 chars, alphanumeric + `_` / `-` | `422 VALIDATION_ERROR` |
| `email` | Required, valid email format, lowercase normalized, max 255 chars | `422 VALIDATION_ERROR` / `409 EMAIL_TAKEN` |
| `password` | Required, 8–72 chars, at least 1 letter and 1 number | `422 VALIDATION_ERROR` |
| `entry.title` | Required, 3–120 chars, trimmed | `422 VALIDATION_ERROR` |
| `entry.entryType` | Enum: `'SNIPPET' \| 'PROMPT'` | `422 VALIDATION_ERROR` |
| `entry.language` | Required, 1–40 chars (e.g. `typescript`, `python`, `sql`, `markdown`) | `422 VALIDATION_ERROR` |
| `entry.visibility` | Enum: `'PUBLIC' \| 'PRIVATE'` | `422 VALIDATION_ERROR` |
| `entry.content` | Required, 10–20,000 chars | `422 VALIDATION_ERROR` |
| `entry.description` | Optional, max 500 chars | `422 VALIDATION_ERROR` |
| `entry.tags` | Optional array, max 8 items, each 1–24 chars lowercase slug | `422 VALIDATION_ERROR` |
| `category.name` | Required, 2–50 chars, unique slug | `422` / `409 CATEGORY_EXISTS` |

## 5. UI State Matrix

Every interactive screen implements explicit, accessible (`role="status"` / `aria-live`) states:

| Screen | Loading State | Empty State | Error State | Success State |
|---|---|---|---|---|
| **Explore (`/`)** | 6-card responsive skeleton grid | "No snippets or prompts match your filters" + **Reset Filters** button | Inline alert banner with **Retry** button | Grid of entry cards + pagination footer |
| **Entry Detail (`/entries/:id`)** | Header + code block skeleton | `404` card with **Back to Explore** link | Permission denied (`403`) or network error + Retry | Highlighted content, Copy toast, Prompt Playground |
| **My Vault (`/vault`)** | Table/card skeleton | "Your vault is empty" + **Create First Entry** CTA | Error banner + Retry | Filterable list with Edit/Delete/Visibility badges |
| **Bookmarks (`/bookmarks`)** | Card skeleton | "No bookmarks saved yet" + **Browse Explore** CTA | Error banner + Retry | Saved entries grid with instant unbookmark |
| **Entry Form (`/new`, `/edit`)** | Category select skeleton / disabled submit spinner | `—` | Field-level inline validation + API error banner | Redirect to detail + success toast |
| **Admin (`/admin`)** | Stats + table skeleton | "No users/categories found" | `403` guard notice or error banner + Retry | Category CRUD + User status toggles + toast |
