# LendLoop — Local Setup & Deployment Guide

This project is a plain Node.js monorepo with two independent apps:

- `lendloop-backend/` — Node.js + Express REST API
- `lendloop-frontend/` — React + TanStack Start (Vite/Nitro) frontend

Both are platform-independent: no special hosting service is required. The only external dependency is a **Supabase** project (Postgres database + credentials). Everything below works on macOS, Linux, and Windows.

---

## 1. Prerequisites

- **Node.js 20.19+** and **npm** — check with `node -v` and `npm -v`. Get it from https://nodejs.org if needed.
- **Git**.
- A **Supabase** project (free tier is fine) — https://supabase.com. You need this project's existing database already set up with the LendLoop schema (users, assets, rentals, reviews, notifications tables). If you're cloning this exact repo, the schema/data already exist in your Supabase project; you just need the URL and service role key (see step 3).

---

## 2. Clone the repository

```bash
git clone https://github.com/<your-username>/LendLoop.git
cd LendLoop
```

---

## 3. Configure environment variables

Neither `.env` file is committed to git (by design — they hold secrets). Copy the example files and fill them in:

```bash
cp lendloop-backend/.env.example lendloop-backend/.env
cp lendloop-frontend/.env.example lendloop-frontend/.env
```

### 3a. Backend — `lendloop-backend/.env`

| Variable | Where to get it |
|---|---|
| `PORT` | Leave as `3001`, or pick another free port (e.g. `8080`). |
| `NODE_ENV` | `development` for local use. |
| `SUPABASE_URL` | Supabase dashboard → your project → **Settings → API** → "Project URL". |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → **Settings → API** → "service_role" secret key. **Never expose this in frontend code or commit it.** |
| `JWT_SECRET` | A long random string. Generate one with:<br>`node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"` |
| `JWT_EXPIRES_IN` | Leave as `7d`, or change to your preference. |
| `CLIENT_URL` | The URL your frontend runs on, e.g. `http://localhost:5000`. `*` also works for local dev since this API uses Bearer tokens, not cookies. |

### 3b. Frontend — `lendloop-frontend/.env`

| Variable | Notes |
|---|---|
| `FRONTEND_PORT` | Port the frontend listens on. Default `5000`. Set to `3000` or `8080` if you prefer. |
| `BACKEND_PORT` | Must match the backend's `PORT` above. Default `3001`. The frontend uses this to build its built-in `/api` proxy, so the browser only ever talks to the frontend's own origin. |
| `VITE_API_BASE_URL` | Leave **empty** for normal local use (the built-in proxy handles it). Only set this to an absolute URL if the backend is deployed separately from the frontend. |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional. Leave empty — the app uses Leaflet + OpenStreetMap for maps and works fully without any Maps API key. |

> Keep `PORT` (backend) and `BACKEND_PORT` (frontend) in sync — they must both describe the same port.

---

## 4. Install dependencies

From the repository root, install both apps in one step:

```bash
npm run install:all
```

(Equivalent to running `npm install` inside both `lendloop-backend/` and `lendloop-frontend/` separately, plus installing the small root-level dev tooling used to run both at once.)

---

## 5. Run it locally

**Option A — one command, both servers together (recommended):**

```bash
npm run dev
```

This starts the backend and frontend concurrently, each labeled in the terminal output. Stop both with `Ctrl+C`.

**Option B — two terminals, run each independently:**

```bash
# Terminal 1
cd lendloop-backend
npm run dev

# Terminal 2
cd lendloop-frontend
npm run dev
```

Once both are running:

- Frontend: `http://localhost:5000` (or whatever `FRONTEND_PORT` you set)
- Backend health check: `http://localhost:3001/health` (or whatever `PORT` you set)

Log in with one of the demo accounts from the README, or register a new account.

---

## 6. Running on a different port (3000 / 8080 / etc.)

Everything is driven by the `.env` files — you don't need to touch any code.

To run the frontend on port `3000` and the backend on `8080`, for example:

**`lendloop-backend/.env`**
```
PORT=8080
CLIENT_URL=http://localhost:3000
```

**`lendloop-frontend/.env`**
```
FRONTEND_PORT=3000
BACKEND_PORT=8080
```

Restart both servers after changing `.env` files (they're only read on startup).

---

## 7. Building for production

```bash
# From the repo root
npm run build          # builds the frontend (lendloop-frontend/.output)

# Then run both in production mode
npm start               # starts backend + built frontend together
```

Under the hood:
- Backend: `node src/server.js` (no build step needed — plain Node/Express).
- Frontend: Nitro (the frontend's build tool) compiles to `lendloop-frontend/.output/server/index.mjs`, started with `node .output/server/index.mjs`.

For a real deployment (not just running locally), put the backend and frontend behind a process manager (e.g. `pm2`) or containerize them, set `NODE_ENV=production`, and set `CLIENT_URL`/`VITE_API_BASE_URL` to your real public URLs instead of `localhost`.

---

## 8. Troubleshooting

**"Missing required environment variable: SUPABASE_URL" (or similar) on backend startup**
The backend refuses to start without `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET` set. Double-check `lendloop-backend/.env` exists and has real values (not the placeholder text from `.env.example`).

**Frontend loads but every request fails / network errors in the browser console**
- Confirm the backend is actually running (`http://localhost:3001/health` should return JSON).
- Confirm `BACKEND_PORT` in the frontend's `.env` matches `PORT` in the backend's `.env`.
- Restart the frontend dev server after changing `.env` — Vite only reads it on startup.

**CORS error in the browser console**
Set `CLIENT_URL` in `lendloop-backend/.env` to exactly match the URL you're loading the frontend from (including port), or use `*` for local development.

**"Port already in use"**
Another process is already using that port. Either stop it, or change `PORT`/`FRONTEND_PORT` in the relevant `.env` file to a free port and restart.

**Node version errors during `npm install`**
This project requires Node 20.19+ for the frontend (Node 18+ for the backend alone). Update Node (e.g. via https://nodejs.org or a version manager like `nvm`) and re-run `npm run install:all`.

---

## 9. Security notes before going further than local dev

- Never commit real `.env` files — only `.env.example` files belong in git.
- Rotate `JWT_SECRET` and the Supabase service role key if they were ever shared, committed, or exposed.
- Set `CLIENT_URL` to your exact production frontend URL once deployed publicly — don't leave it as `*` in production.
- The Supabase **service role key** bypasses row-level security; it must only ever live in backend environment variables, never in frontend code or a browser bundle.
