---
name: Replit fullstack CORS fix via Nitro proxy
description: How to fix CORS/backend connectivity in a TanStack Start + Nitro frontend talking to a separate Express backend on Replit dev.
---

## The Problem

In Replit dev environment, the frontend preview is proxied through Replit's domain. When the browser makes cross-origin requests to the backend on a different port (e.g., port 3001), Replit's reverse proxy **strips CORS headers** from responses, causing:

```
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Even with `cors({ origin: '*' })` on the backend, the header never reaches the browser.

Additionally, Vite's `server.proxy` does NOT work with TanStack Start + Nitro — Nitro intercepts all incoming requests before the Vite proxy can forward them, returning 404 instead.

## The Fix

Use **Nitro's `routeRules` proxy** in `vite.config.ts`:

```ts
nitro({
  routeRules: {
    "/api/**": { proxy: "http://localhost:3001/api/**" },
    "/health": { proxy: "http://localhost:3001/health" },
  },
}),
```

This makes Nitro itself (running on port 5000) forward `/api/*` to the backend server-side — no CORS involved.

In `api/config.ts`, use SSR-aware API base URL:

```ts
const isServer = typeof window === "undefined";
export const API_BASE_URL = isServer
  ? "http://localhost:3001"  // SSR: direct internal access
  : "";                       // Client: relative URL → Nitro proxy
```

**Why:** Nitro proxy handles the forwarding inside the container, so the browser always talks to the same origin (port 5000). No cross-origin request ever reaches the backend directly from the browser.

## Port Setup

- Frontend (Vite/Nitro): port 5000 — webview workflow
- Backend (Express): port 3001 — console workflow, started with `PORT=3001 npm start` inline (do NOT set PORT in shared env — Nitro/Vite picks it up and overrides the frontend port)
