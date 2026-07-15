# Changelog

## Unreleased — Admin Portal + Browse Redesign

### Hotfix
- **Fixed**: `GET /api/assets`, `/api/assets/search`, and `/api/assets/nearby` were returning `500 Failed to fetch assets` on databases where `sql/002_admin_features.sql` hadn't been run yet, because the `admin_hidden` filter referenced a column that didn't exist. These endpoints now detect column availability once (cached per process) and skip the filter gracefully if it's missing — core browsing works identically whether or not the migration has been applied. `middleware/admin.middleware.js` now also returns a clear `503` (instead of a generic `500`) if admin routes are hit before the migration has run.

### Database
- Added `users.is_admin`, `users.last_seen`, `assets.admin_hidden` columns and a new `activity_logs` table. See `lendloop-backend/sql/002_admin_features.sql`. No existing table/column was renamed or removed.

### Backend
- **Added**: `middleware/admin.middleware.js`, `services/activity.service.js`, `services/admin.service.js`, `controllers/admin.controller.js`, `validators/admin.validator.js`, `routes/admin.routes.js`, mounted at `/api/admin/*`.
- **Changed**: `middleware/auth.middleware.js` now updates `last_seen` on every authenticated request (non-blocking).
- **Changed**: `services/auth.service.js`, `services/asset.service.js`, `services/rental.service.js`, `services/review.service.js` now emit activity-log events at key lifecycle points (register, login, asset listed/deleted, rental requested/approved/completed, review submitted). These are additive `logActivity()` calls only — no existing return value, status code, or business rule changed.
- **Changed**: `services/asset.service.js` public listing/search/nearby queries now also filter out `admin_hidden = true` assets.
- **Changed**: `services/review.service.js` now exports `recalculateAverageRating` for reuse by the admin review-deletion flow.

### Frontend
- **Added**: `/admin`, `/admin/users`, `/admin/users/:userId`, `/admin/assets`, `/admin/rentals`, `/admin/reviews`, `/admin/activity`, `/admin/analytics` routes.
- **Added**: `services/adminService.ts`, `components/PresenceBadge.tsx`, `components/admin/StatCard.tsx`, `components/AssetCardSkeleton.tsx`.
- **Changed**: `utils/types.ts` — `User` gained `is_admin`/`last_seen`; new `AdminUser`, `AdminOverview`, `AdminUserDetail`, `AdminAsset`, `AdminRental`, `AdminReview`, `AdminAnalytics`, `ActivityLog`, `Presence` types.
- **Changed**: `api/config.ts` — added `ENDPOINTS.admin.*`.
- **Changed**: `components/Navbar.tsx` — adds an "Admin" link (desktop nav, mobile menu, account dropdown) only for `is_admin` users. No existing link was removed or renamed.
- **Changed**: `routes/browse.tsx` — added a sort dropdown (client-side sort of the current page: newest, most rented, highest rated, price asc/desc) and swapped the loading spinner for a skeleton grid. Existing map, geolocation, distance filter, and category-merge search logic is untouched.
- **Changed**: `components/AssetCard.tsx` — now also shows a "rented N×" stat.

### Docs
- **Added**: `ADMIN_PORTAL.md`, `CHANGELOG.md` (this file).
- **Changed**: root `README.md` — new "Admin Portal & Browse Redesign" section with the migration step, linking to `ADMIN_PORTAL.md`.

### Validation performed
- Backend: `node --check` on every file, plus a real boot test (`node src/server.js` with dependencies installed) confirming `/health` returns 200 and `/api/admin/overview` correctly returns 401 without a token.
- Frontend: `npm install`, `npx tsc --noEmit`, and `npm run build` (Vite + Nitro + route-tree generation) all pass. No new TypeScript errors were introduced (5 pre-existing, unrelated errors remain in files this update didn't touch).
- Confirmed zero Replit-specific packages, imports, or config anywhere in the project (`grep -ri replit` across all source, excluding `node_modules`, returns nothing).
