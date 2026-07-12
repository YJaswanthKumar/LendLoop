# LendLoop — Deployment Guide

This guide takes you from this cleaned-up codebase to a live deployment:
**backend on Render**, **frontend on Vercel** (with a Render-only alternative
at the end). Follow it in order — the steps are ordered specifically to avoid
the most common failure points (CORS mismatches, missing env vars, wrong
Node version, wrong root directory).

---

## 0. Read this first — a security issue was found and partially fixed

While preparing this repo for deployment, I found that **`lendloop-backend/.env`
and `lendloop-backend/.env.example` contained real, working credentials**
(a Supabase **service role key** and a **JWT signing secret**), and the
backend had **no `.gitignore`** — so `.env` was very likely committed to your
public GitHub repository history.

The service role key bypasses all database security rules (Row Level
Security) — anyone who finds it has full read/write access to your Supabase
database.

What was done automatically:
- Added `lendloop-backend/.gitignore` (excludes `.env` from now on).
- Replaced `.env.example` with safe placeholder values.
- Generated a **new** `JWT_SECRET` in your local `.env` (this invalidates
  any previously issued login tokens — users will simply need to log in
  again, no data is lost).

What **you must still do** before/at deployment (I cannot do this part for
you — it requires your Supabase dashboard):

1. Go to your Supabase project → **Settings → API**.
2. Under **Project API keys**, click to regenerate/roll the **service_role**
   key.
3. Put the new key in `lendloop-backend/.env` (`SUPABASE_SERVICE_ROLE_KEY=`)
   for local use, and in Render's environment variables (step 3 below) for
   production.
4. If this repo is on **public** GitHub, consider the old key permanently
   compromised even after rotation — rotating it is what actually fixes the
   exposure, removing it from the file does not undo the git history leak.
   If you want the old commits gone too, you'd need to rewrite git history
   (e.g. `git filter-repo`) or make the repository private — rotating the
   key is the important part either way.

---

## 1. What was changed to remove Lovable

| File | Change |
|---|---|
| `lendloop-frontend/vite.config.ts` | Replaced the `@lovable.dev/vite-tanstack-config` wrapper with a plain Vite config using the same underlying official plugins (`@tanstack/react-start`, `nitro/vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-tsconfig-paths`) |
| `lendloop-frontend/package.json` | Removed `@lovable.dev/vite-tanstack-config` devDependency; renamed package from placeholder `tanstack_start_ts` to `lendloop-frontend`; added a `start` script and `engines.node` |
| `lendloop-frontend/src/lib/lovable-error-reporting.ts` | Deleted (only reported errors to Lovable's own editor preview; a no-op outside Lovable) |
| `lendloop-frontend/src/routes/__root.tsx` | Removed the import/usage of the deleted file |
| `lendloop-frontend/bunfig.toml` | Removed Lovable-specific package allowlist |
| `lendloop-frontend/package-lock.json`, `bun.lock` | Removed — they referenced the removed package; regenerate with `npm install` (see step 2) |

**Nothing in your app/business logic, database schema, API routes, request/response
shapes, or Supabase queries was touched.** I checked the favicon and the full
codebase for any "Edit with Lovable" badge/script — there isn't one baked
into the source (Lovable injects that only in its own hosted preview, not
into exported code), so there was nothing further to strip there.

---

## 2. Prerequisites

- **Node.js 20.19+ or 22.12+** installed locally (Vite 8 requires this — an
  older Node version is a common source of "works locally, fails to build
  on the platform" errors). Check with `node -v`.
- A [Render](https://render.com) account (for the backend).
- A [Vercel](https://vercel.com) account (for the frontend).
- Your Supabase project already has the LendLoop schema created (this repo
  doesn't manage migrations — the backend README documents the expected
  tables: `users`, `assets`, `rentals`, `reviews`, `notifications`).
- Push this cleaned-up code to a GitHub/GitLab/Bitbucket repository (both
  Render and Vercel deploy from a git repo).

Regenerate the frontend lockfile once, locally, before you push (the old one
was deleted because it referenced the removed Lovable package):

```bash
cd lendloop-frontend
npm install
```

This creates a fresh `package-lock.json`. Commit it.

---

## 3. Deploy the backend to Render

The backend is a plain Express app — this is the simpler, more predictable
half of the deployment.

### 3.1 Create the service

**Option A — Dashboard (recommended for a first deploy):**

1. Render dashboard → **New +** → **Web Service**.
2. Connect your GitHub repo.
3. Set:
   - **Root Directory**: `lendloop-backend` ⚠️ *(most common mistake:
     leaving this blank — Render will then fail to find `package.json`)*
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid, your choice)

**Option B — Blueprint (`render.yaml`):**

A `render.yaml` is already included at the repo root. In Render, choose
**New + → Blueprint**, point it at your repo, and Render will read it and
propose the `lendloop-backend` web service automatically. You'll still be
prompted to fill in the secret env vars (see below).

### 3.2 Set environment variables

In the service's **Environment** tab, add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://your-project-ref.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | your **rotated** service role key (see §0) |
| `JWT_SECRET` | a strong random string — reuse the one already generated in your local `.env`, or generate a new one with `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"` |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | your Vercel frontend URL, e.g. `https://lendloop.vercel.app` — **no trailing slash** |

Do **not** set `PORT` — Render injects it automatically, and the app already
reads `process.env.PORT`.

⚠️ **`CLIENT_URL` is the single most common cause of "it deployed but
nothing works."** The backend's CORS check (`cors({ origin: env.clientUrl })`)
does an exact string match. If it doesn't match the frontend's real URL
exactly (protocol, no trailing slash, correct subdomain), every request from
the browser will fail with a CORS error, even though the API itself is
healthy. You'll come back and update this value once you know your Vercel
URL from step 4 — that's expected and fine.

### 3.3 Health check

Set the **Health Check Path** to `/health` in the service settings (already
set if you used the Blueprint). This lets Render detect a genuinely broken
deploy instead of just "port is open."

### 3.4 Deploy and verify

Click **Create Web Service**. After the build finishes, visit:

```
https://<your-service>.onrender.com/health
```

You should see:
```json
{ "success": true, "message": "LendLoop API is healthy", "data": { "uptime": 12.34 } }
```

If it fails, check the Render logs — the app itself exits immediately with a
clear message if `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, or `JWT_SECRET`
are missing, so a crash-on-boot almost always means one of those three.

> **Free-tier note:** Render's free web services spin down after inactivity
> and take ~30-60s to wake on the next request. That's normal, not a bug —
> upgrade to a paid instance if you need it always warm.

---

## 4. Deploy the frontend to Vercel

The frontend uses TanStack Start + Nitro, which Vercel supports natively
(Vercel auto-detects the `nitro()` plugin already present in
`vite.config.ts` and builds accordingly).

### 4.1 Import the project

1. Vercel dashboard → **Add New → Project** → import your repo.
2. In **Configure Project**, set:
   - **Root Directory**: `lendloop-frontend` ⚠️ *(same mistake as Render —
     this is a monorepo, so this must be set explicitly)*
   - **Framework Preset**: should auto-detect as "TanStack Start" once Root
     Directory is set correctly. If it doesn't, the included
     `lendloop-frontend/vercel.json` forces it via `"framework": "tanstack-start"`.
   - **Build Command** / **Install Command**: leave as detected (or
     `npm run build` / `npm install` if you want to be explicit — also
     already set in `vercel.json`).
3. **Node.js Version** (Project Settings → General): set to **20.x** or
   **22.x** — must be 20.19+/22.12+ to match Vite 8's requirement.

### 4.2 Set environment variables

In **Project Settings → Environment Variables**, add for all environments
(Production/Preview/Development):

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | your Render backend URL, e.g. `https://lendloop-backend.onrender.com` (no trailing slash) |
| `VITE_GOOGLE_MAPS_API_KEY` | optional — leave empty to use the graceful map fallback |

Only variables prefixed `VITE_` are safe here — they get bundled into the
browser code. (This frontend has no server-only secrets, so that's all you
need.)

### 4.3 Deploy

Click **Deploy**. Once it finishes, open the deployment URL and confirm:
- The home page renders (server-side content visible immediately, not a
  blank page that fills in later).
- `/browse` and other routes work when navigated to directly (not just via
  client-side links) — this specifically confirms the Nitro server build is
  working, not just the static shell.
- Register/login actually reaches your backend (check the Network tab for
  the API calls, and watch for CORS errors in the console).

### 4.4 Close the loop on CORS

Now that you have your real Vercel URL, go back to **Render → your backend
service → Environment**, update `CLIENT_URL` to match it exactly, and
trigger a redeploy (Render redeploys automatically on env var save, or use
"Manual Deploy").

---

## 5. Post-deployment checklist

- [ ] Supabase service role key rotated (§0) and updated in Render, not just
      locally.
- [ ] `lendloop-backend/.env` is **not** tracked by git (`git status` should
      not show it; the new `.gitignore` prevents this going forward).
- [ ] Backend `/health` returns `success: true`.
- [ ] Frontend loads and a full register → create asset → browse →
      request rental flow works end-to-end against the deployed backend.
- [ ] `CLIENT_URL` (Render) and `VITE_API_BASE_URL` (Vercel) point at each
      other's *actual* deployed URLs, with no trailing slashes.
- [ ] `JWT_SECRET` is the same value only within one deployment (backend) —
      it doesn't need to match anything on the frontend, but changing it
      later will invalidate all existing sessions.

---

## 6. Troubleshooting quick-reference

| Symptom | Likely cause |
|---|---|
| Render build fails immediately | Root Directory not set to `lendloop-backend`, or Node version issue |
| Render service builds but crashes on boot | Missing `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `JWT_SECRET` env var — check logs, the app exits with the exact missing key name |
| Frontend builds locally but fails on Vercel | Node version mismatch — set 20.x/22.x explicitly in Vercel project settings |
| Vercel shows a 404 on any route except `/` | The `nitro()` plugin isn't being picked up — confirm `vite.config.ts` still contains it and that Root Directory is `lendloop-frontend` (if Root Directory is wrong, Vercel may be building the wrong `vite.config.ts` or none at all) |
| Browser console: CORS error / "blocked by CORS policy" | `CLIENT_URL` on Render doesn't exactly match the frontend's real URL (protocol, subdomain, or trailing slash mismatch) |
| Frontend loads but every API call fails with a network error | `VITE_API_BASE_URL` wrong, or the Render service is asleep (free tier) — check the Network tab, retry after ~30s |
| Login "works" but user is immediately logged out | Backend `JWT_SECRET` changed between deploys, or the token from an old backend instance is stale — clear localStorage and log in again |

---

## 7. Alternative: frontend on Render instead of Vercel

If you'd rather keep both halves on one platform, deploy the frontend to
Render too, as a second Node web service:

- **Root Directory**: `lendloop-frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start` (already defined — runs
  `node .output/server/index.mjs`, Nitro's Node output)
- Same `VITE_API_BASE_URL` / `VITE_GOOGLE_MAPS_API_KEY` env vars as in §4.2

Nitro's Vite plugin defaults to its Node-server output when it doesn't
detect a specific platform (like Vercel's `VERCEL` build env var), so this
works without any config changes — the same `vite.config.ts` serves both
paths.
