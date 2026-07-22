# ROL — Rent or Lend

Community asset sharing & rental platform. Get anything from neighbours near you. Earn from your own things.

## Stack

- **Frontend**: React + Vite + TanStack Router/Start (port 5000)
- **Backend**: Node.js + Express, MVC + Service Layer (port 3001)
- **Database**: Supabase (PostgreSQL)
- **Node.js**: 22 (required — supabase-js v2 needs native WebSocket from Node 22+)

## Running Locally on Replit

Two workflows are configured:

| Workflow | Command | Port | Type |
|---|---|---|---|
| **Start application** | `npm run dev --prefix lendloop-frontend` | 5000 | webview |
| **Backend** | `npm run dev --prefix lendloop-backend` | 3001 | console |

The frontend proxies `/api/**` and `/health` to the backend via the Nitro/Vite proxy in `lendloop-frontend/vite.config.ts`.

## Required Secrets

Set in Replit Secrets (Settings → Secrets):

| Key | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API → service_role key |
| `JWT_SECRET` | Any strong random string (64+ chars) |

## Non-secret Environment Variables (shared)

| Key | Value | Notes |
|---|---|---|
| `NODE_ENV` | `development` | |
| `CLIENT_URL` | `http://localhost:5000` | CORS origin for backend |
| `FRONTEND_PORT` | `5000` | Vite dev server port — do NOT also set `PORT` (it conflicts) |
| `BACKEND_PORT` | `3001` | Used by Vite proxy config |
| `JWT_EXPIRES_IN` | `7d` | JWT token lifetime |

## Brand

The app was originally named "LendLoop". It is now branded **ROL (Rent or Lend)**. All visible UI text, page titles, and meta descriptions use "ROL" or "Rent or Lend".

## Browse Page Layout

Desktop: two-column — results grid on the left, sticky map panel on the right (fills viewport height). Mobile: map is hidden by default with a "Show map" toggle button; results shown as a 2-column grid.

## Asset Cards

- Mobile: square image aspect ratio, compact text, 2-column grid
- Desktop (sm+): 4:3 image aspect ratio, full labels, 3-4 column grid

## Project Structure

```
lendloop-backend/     Express API (46 endpoints across 8 modules)
lendloop-frontend/    React + TanStack Start SPA
supabase/             SQL migration files
```

## Admin Portal

Visit `/admin` with an account that has `is_admin = true` in the database.
Run `sql/002_admin_features.sql` on your Supabase project first if not done.

## User Preferences

- Keep Node.js at version 22+ (supabase-js realtime requires native WebSocket).
- Do not set `PORT` as a shared env var — it conflicts with the frontend's `FRONTEND_PORT`.
- Brand name is ROL / Rent or Lend — do not revert to LendLoop.
