# LendLoop Admin Portal — Guide

## 1. What was built

A full admin portal reusing the existing stack (Express + Supabase on the backend, React + TanStack Start + Tailwind + shadcn/recharts on the frontend). No framework was swapped, no existing route was renamed, no existing API was changed in a breaking way.

### Backend additions
- `lendloop-backend/sql/002_admin_features.sql` — migration adding:
  - `users.is_admin` (boolean, default false)
  - `users.last_seen` (timestamp) — presence heartbeat
  - `assets.admin_hidden` (boolean, default false) — admin "hide" distinct from an owner's own delete
  - `activity_logs` table — the platform activity feed
- `src/middleware/admin.middleware.js` — `requireAdmin`, checked after `authenticate`
- `src/services/activity.service.js` — fire-and-forget `logActivity()` + feed query
- `src/services/admin.service.js` — overview stats, users, user detail, assets, rentals, reviews, analytics
- `src/controllers/admin.controller.js`, `src/validators/admin.validator.js`, `src/routes/admin.routes.js`
- Minimal, additive hooks in existing services (`auth`, `asset`, `rental`, `review`) that call `logActivity()` — none of the original logic, response shapes, or status codes were changed
- `authenticate` middleware now also updates `users.last_seen` on every request, fire-and-forget (never blocks or fails a request)

### Frontend additions
- `src/routes/admin.tsx` — layout with sidebar nav, guarded so only `is_admin` users can enter (others see an "Admin access required" screen; unauthenticated users are redirected to `/login`)
- `src/routes/admin.index.tsx` — Overview: stat cards (users, assets, rentals, reviews, disputes placeholder) + rental growth chart + latest activity
- `src/routes/admin.users.tsx` — Users list: search, active/deactivated filter, sort, presence badge
- `src/routes/admin.users.$userId.tsx` — User detail: profile, assets listed, rentals given/taken, reviews received/given, notifications, activate/deactivate action
- `src/routes/admin.assets.tsx` — Assets: search, category filter, sort, hide/unhide, remove
- `src/routes/admin.rentals.tsx` — Rentals: status filter, search, full transaction table
- `src/routes/admin.reviews.tsx` — Reviews: rating filter, delete
- `src/routes/admin.activity.tsx` — Platform activity feed, filterable by event type
- `src/routes/admin.analytics.tsx` — Charts: new users/day, rental growth/day, most-rented categories (pie), rentals by status, top assets/owners/borrowers
- `src/services/adminService.ts` — typed API client for all of the above
- `src/components/PresenceBadge.tsx`, `src/components/admin/StatCard.tsx` — small reusable pieces
- `Navbar.tsx` — an "Admin" link appears (desktop nav, mobile menu, account dropdown) only when `user.is_admin` is true

## 2. Live user activity (presence)

True WebSocket presence wasn't introduced (the brief asked to avoid external services). Instead:
- Every authenticated API call touches `users.last_seen` (non-blocking `UPDATE`).
- The admin API classifies each user as:
  - **Online** — `last_seen` within the last 2 minutes
  - **Recently active** — within the last 30 minutes
  - **Offline** — anything older, or never logged in
- This is visible in the Users list, the user detail header, and rolls up into the Overview's "Logged in now" stat.

This is a genuine best-effort heartbeat, not a simulation — it reflects real request activity.

## 3. What was intentionally left out (and why)

To stay honest about scope, a few items from the original brief were simplified or deferred rather than faked:

| Item | Status |
|---|---|
| Logout history | Not implemented — there's no server-side session/logout event today (JWT is stateless), so there's nothing real to log. Login events are logged. |
| Wishlist tab | Not implemented — no wishlist table exists in the schema. The tab was omitted rather than shown empty/fake. |
| Payment / deposit info on rentals | Shown as the existing `security_deposit` field; no payment processor exists, so it's not "future-ready" beyond what the schema already has. |
| True real-time activity feed (WebSocket push) | The feed is a polling table read (`GET /api/admin/activity`), not a live socket push — consistent with "don't introduce external services." Refresh or revisit the page for new events. |
| Disputes | Reserved a `totalDisputes: 0` field on the overview so the UI has a slot ready, but no disputes table/workflow exists yet. |

## 4. Running the migration

Run `lendloop-backend/sql/002_admin_features.sql` once against your Supabase database (SQL editor or `psql`). It's idempotent (`IF NOT EXISTS` throughout), so it's safe to re-run.

Then promote yourself:
```sql
UPDATE users SET is_admin = TRUE WHERE email = 'you@example.com';
```

**If you haven't run the migration yet**: core browsing (`GET /api/assets`, `/search`, `/nearby`) works fine regardless — those endpoints detect whether the `admin_hidden` column exists (checked once, cached) and simply skip that filter if it's missing, instead of erroring. The admin routes themselves (`/api/admin/*`) will return a clear `503` telling you to run the migration, rather than a raw `500`. Once you run it, restart the backend so the cached column check re-evaluates.

## 5. New admin API surface

All routes below require `Authorization: Bearer <token>` **and** `is_admin = true`; otherwise they return `401`/`403` with the standard `{ success, message, errors }` envelope.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/overview` | Platform-wide stat cards |
| GET | `/api/admin/analytics` | Charts data (growth, categories, top performers) |
| GET | `/api/admin/activity` | Activity feed (paginated, filterable by `type`) |
| GET | `/api/admin/users` | Users list (`search`, `isActive`, `isAdmin`, `sortBy`, `sortDir`, pagination) |
| GET | `/api/admin/users/:userId` | Full user detail bundle |
| PATCH | `/api/admin/users/:userId/status` | Activate/deactivate a user (`{ isActive: boolean }`) |
| GET | `/api/admin/assets` | Assets list with owner info (`search`, `category`, `availabilityStatus`, `ownerId`, sort, pagination) |
| PATCH | `/api/admin/assets/:assetId/hidden` | Hide/unhide a listing (`{ hidden: boolean }`) |
| DELETE | `/api/admin/assets/:assetId` | Remove a listing (soft delete, same as owner delete) |
| GET | `/api/admin/rentals` | Rentals list with owner/borrower/asset info (`status`, `search`, pagination) |
| GET | `/api/admin/reviews` | Reviews list with reviewer/receiver info (`minRating`, `maxRating`, pagination) |
| DELETE | `/api/admin/reviews/:reviewId` | Delete a review (recalculates the receiver's average rating) |

## 6. Browse page improvements (Priority 2)

The existing browse page already had a working map, geolocation, distance filter, and category-merge search — that logic was left untouched. Additions:
- **Sort dropdown**: Recently added / Most rented / Highest rated / Price (asc/desc), applied client-side over the current result page.
- **Skeleton loading**: `AssetCardSkeletonGrid` replaces the spinner for the results grid so the layout doesn't jump.
- **Asset card**: now also shows a "rented N×" stat alongside distance/city.

Full visual overhaul items from the original brief (quick-view modal, wishlist button, deposit placeholder on the card) were **not** added — the existing card and detail page already cover price, rating, review count, category, and negotiable badge, and adding placeholders for features with no backend behind them (wishlist, deposit) would be dead UI. Flag if you'd like these added as inert placeholders anyway.

## 7. Steps to run locally

```bash
# Backend
cd lendloop-backend
npm install
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
# run sql/002_admin_features.sql against your Supabase DB, then promote your admin user
npm run dev

# Frontend (new terminal)
cd lendloop-frontend
npm install
npm run dev
```

Both `npm install` and `npm run build` were verified against this exact codebase (backend syntax-checked and boot-tested; frontend `tsc --noEmit`, `vite build`, and route-tree generation all pass) with no Replit dependency anywhere in either `package.json`.

## 8. Deployment

Unchanged: **Frontend → Vercel**, **Backend → Render**. No new environment variables are required beyond what already existed — the admin features reuse the same Supabase service-role connection and JWT secret.
