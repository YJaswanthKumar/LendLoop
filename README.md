# LendLoop

**Community Asset Sharing & Rental Platform**

LendLoop is a full-stack web application where people list, discover, rent, and manage community-owned assets through a secure, user-friendly platform. Instead of purchasing items used only occasionally, users share resources within their community — making rentals more affordable and reducing unnecessary ownership.

> 📖 For detailed technical documentation, see:
> - **[BACKEND_README.md](./BACKEND_README.md)** — full API reference, database schema, business rules, admin API
> - **[FRONTEND_README.md](./FRONTEND_README.md)** — all pages, components, services, and feature details

---

## Quick Links

| Resource | URL |
|---|---|
| Frontend (Live) | https://lend-loop-kohl.vercel.app |
| Backend API (Live) | https://lendloop-oizd.onrender.com |
| Health Check | https://lendloop-oizd.onrender.com/health |

---

## Test Credentials

### Regular Users

Pre-populated with sample assets, rental history, notifications, and reviews.

| Account | Email | Password |
|---|---|---|
| Test User 1 | test123@gmail.com | Test@123 |
| Test User 2 | test1@gmail.com | Test@123 |
| Test User 3 | test2@gmail.com | Test@123 |
| Test User 4 | check1@gmail.com | check@123 |

### Admin Account

To access the admin portal at `/admin`, you need an account with `is_admin = true` in the database.

```sql
-- Promote any registered account to admin:
UPDATE users SET is_admin = TRUE WHERE email = 'your@email.com';
```

> If you haven't run the admin migration yet, run `sql/002_admin_features.sql` against your Supabase database first (see [Admin Setup](#admin-portal-setup) below).

Once promoted, the **Admin** link appears automatically in the navbar (desktop nav, mobile menu, account dropdown).

---

## Architecture

### System Overview

```
                   Internet
                       │
       ┌───────────────┼────────────────┐
       │                               │
       ▼                               ▼
Frontend (Vercel)               Backend (Render)
  React + Vite                  Node.js + Express
  TanStack Router                  MVC + Service Layer
       │                               │
       └────────── REST API ───────────┘
                       │
                       ▼
             Supabase PostgreSQL
```

### Request Flow

```
Browser (React)
    │  HTTP request
    ▼
Express Router
    │
    ▼
Middleware (Auth / Validation)
    │
    ▼
Controller
    │
    ▼
Service Layer (Business Logic)
    │
    ▼
Supabase Client
    │
    ▼
PostgreSQL Database
    │
    ▼
JSON Response → Frontend UI Update
```

### Database Relationships

```
                   +----------------+
                   |     Users      |
                   +----------------+
                          │
          ┌───────────────┼──────────────┐
          │owns           │receives      │
          ▼               ▼             ▼
    +-----------+   +------------+  +----------+
    |  Assets   |   |Wishlist    |  |Notific-  |
    +-----------+   +------------+  |ations    |
          │                         +----------+
          │ rented through
          ▼
    +-----------+
    |  Rentals  |◄──────── owner_id / borrower_id (Users)
    +-----------+
          │
          │ completed rental
          ▼
    +-----------+
    |  Reviews  |◄──────── reviewer_id / receiver_id (Users)
    +-----------+

[Admin only]
    +-----------------+
    |  activity_logs  |  ◄── fires on key lifecycle events
    +-----------------+
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| **Frontend** | React 19 + Vite + TanStack Start (file-based routing) |
| **Backend** | Node.js + Express.js (MVC + Service Layer) |
| **Database** | Supabase PostgreSQL |
| **Auth** | JWT (jsonwebtoken) + bcrypt |
| **HTTP Client** | Axios (with JWT interceptors) |
| **Charts** | recharts |
| **Maps** | Google Maps JS API (optional) |
| **Deployment** | Frontend → Vercel, Backend → Render, DB → Supabase |

---

## Frontend Structure

```
lendloop-frontend/src/
├── api/            # Axios instance + endpoint config
├── components/     # 20+ reusable UI components
│   └── admin/      # Admin-specific components (StatCard)
├── context/        # AuthContext, WishlistContext
├── routes/         # 22 file-based page routes (public + auth + admin)
├── services/       # 8 typed API service modules
├── styles.css      # Design system (tokens, utilities)
└── utils/          # Types, formatters, helpers
```

**Key pages at a glance:**

| Section | Routes |
|---|---|
| Public | `/`, `/register`, `/login`, `/browse`, `/assets/:id`, `/map` |
| Authenticated | `/dashboard`, `/create-asset`, `/edit-asset/:id`, `/wishlist`, `/requests`, `/history`, `/notifications`, `/profile` |
| Admin | `/admin`, `/admin/users`, `/admin/users/:userId`, `/admin/assets`, `/admin/rentals`, `/admin/reviews`, `/admin/activity`, `/admin/analytics` |

> See [FRONTEND_README.md](./FRONTEND_README.md) for the full page-by-page breakdown, all components, and feature details.

---

## Backend Structure

```
lendloop-backend/src/
├── config/         # Supabase client, env validator
├── controllers/    # 8 controllers (auth, asset, rental, review,
│                   #   notification, dashboard, wishlist, admin)
├── services/       # 9 services including admin + activity logging
├── routes/         # 8 route files (all prefixed /api/*)
├── middleware/     # auth, admin, validation, error
├── validators/     # express-validator rule sets
└── utils/          # response helpers, constants, JWT/haversine/pagination
```

**API surface summary:**

| Module | Endpoints | Auth |
|---|---|---|
| Auth | 3 | Public + JWT |
| Assets | 7 | Public + JWT (owner) |
| Rentals | 10 | JWT (participant / owner) |
| Reviews | 2 | Public + JWT |
| Notifications | 3 | JWT |
| Dashboard | 5 | JWT |
| Wishlist | 4 | JWT |
| **Admin** | **12** | **JWT + is_admin** |
| **Total** | **46** | |

> See [BACKEND_README.md](./BACKEND_README.md) for the full API reference with request/response shapes, query parameters, error codes, and admin-specific details.

---

## Key Features

### Core Platform

| Feature | Description |
|---|---|
| **User Auth** | JWT registration/login, bcrypt password hashing, protected routes |
| **Asset Management** | List, edit, soft-delete assets; category, price, availability |
| **Nearby Discovery** | Haversine formula over lat/lng; Google Maps or list view |
| **Rental Negotiation** | REQUESTED → NEGOTIATING → ACCEPTED → ACTIVE → COMPLETED lifecycle |
| **Cancellation Policy** | FLEXIBLE / MODERATE / STRICT — snapshotted at booking, refund computed from days-until-start |
| **Security Deposit** | PENDING → HELD → REFUNDED/PARTIALLY_REFUNDED/FORFEITED; owner resolves post-completion |
| **Reviews & Ratings** | One review per participant per rental (COMPLETED only); average auto-recalculated |
| **Notifications** | Created on every lifecycle event; mark as read |
| **Dashboard** | Stats overview, trending categories/assets, analytics, recent rentals |
| **Wishlist** | Save/unsave any asset (not your own); optimistic heart toggle |

### Admin Portal (`/admin/*`)

| Feature | Description |
|---|---|
| **Overview** | Platform-wide stats: users, assets, rentals, reviews, disputes placeholder |
| **Analytics** | 14-day user/rental growth charts, category pie, top owners/borrowers/assets |
| **Activity Feed** | Chronological event log (register, login, asset listed/deleted, rental lifecycle, reviews), filterable by type |
| **Users** | List with search, active/deactivated filter, sort, presence badge; detail view with full history; activate/deactivate |
| **Assets** | List with search/sort/filter; hide/unhide (admin-only flag, distinct from owner delete); remove (soft delete) |
| **Rentals** | List with status filter and same-page search; participant columns |
| **Reviews** | List with rating filter; delete (auto-recalculates receiver's average rating) |
| **Presence** | ONLINE (≤2 min) / RECENTLY ACTIVE (≤30 min) / OFFLINE — driven by `last_seen` heartbeat |

---

## Rental Status Lifecycle

```
REQUESTED ──► NEGOTIATING ──► ACCEPTED ──► ACTIVE ──► COMPLETED
    │                             │
    ├──────────────────────────► REJECTED
    └──────────────────────────► CANCELLED
```

Key rules:
- Negotiation only available if asset's `price_negotiable` is `true`.
- Cancellation policy + days-until-start determines recommended refund (guidance only, no payment gateway).
- Owner must explicitly confirm pickup (`PATCH /:id/start`) before the rental can be completed.
- Contact info and pickup coordinates are revealed only after `ACCEPTED` status (server-side gate).

---

## Database Schema

### Core Tables

| Table | Purpose |
|---|---|
| `users` | Registered users: profile, location, stats, trust score |
| `assets` | Listings: price, category, deposit, cancellation policy, availability |
| `rentals` | Transactions: offer/counter/agreed prices, deposit lifecycle, contact reveal |
| `reviews` | Post-completion ratings and feedback |
| `notifications` | In-app event notifications |

### Admin Extension (migration `002_admin_features.sql`)

| Addition | Purpose |
|---|---|
| `users.is_admin` | Admin gate |
| `users.last_seen` | Presence heartbeat (updated on every authenticated request) |
| `assets.admin_hidden` | Admin-only hide flag (independent of `is_active`) |
| `activity_logs` table | Platform event log for the admin activity feed |

---

## Admin Portal Setup

> Skip this section if you're just evaluating the main app with the test accounts above.

```bash
# 1. Run the migration once in Supabase SQL Editor (idempotent — safe to re-run)
#    File: lendloop-backend/sql/002_admin_features.sql

# 2. Promote your account
UPDATE users SET is_admin = TRUE WHERE email = 'your@email.com';

# 3. Restart the backend so the column-existence cache re-evaluates
```

Once done, log in with that account and the **Admin** link appears in the navbar.

---

## Local Development

### Prerequisites

- Node.js 20.19+
- A Supabase project with the LendLoop schema

### Quick Start

```bash
# Clone
git clone <repository-url>
cd LendLoop

# Install both apps at once
npm run install:all

# Configure environment variables
cp lendloop-backend/.env.example lendloop-backend/.env
cp lendloop-frontend/.env.example lendloop-frontend/.env
# Edit both .env files (see below)

# Run both servers together
npm run dev
```

Then open `http://localhost:5000` in your browser.

### Backend `.env`

| Variable | Value |
|---|---|
| `PORT` | `3001` (or any free port) |
| `NODE_ENV` | `development` |
| `SUPABASE_URL` | Supabase project URL (Settings → API → Project URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **never** expose in frontend code |
| `JWT_SECRET` | Long random string: `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"` |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `http://localhost:5000` (frontend URL for CORS) |

### Frontend `.env`

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3001` |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional — leave empty for Leaflet/OpenStreetMap fallback |

### Run Options

**Both together (recommended):**
```bash
npm run dev   # from repo root
```

**Separately:**
```bash
# Terminal 1 — backend
cd lendloop-backend && npm run dev

# Terminal 2 — frontend
cd lendloop-frontend && npm run dev
```

URLs:
- Frontend: `http://localhost:5000`
- Backend health: `http://localhost:3001/health`

---

## Deployment

| Component | Platform | Notes |
|---|---|---|
| Frontend | Vercel | SPA rewrite rules in `vercel.json` |
| Backend | Render | Plain Node.js + Express |
| Database | Supabase | PostgreSQL (free tier supported) |

No new environment variables are required for the admin portal — it reuses the same Supabase service-role connection and JWT secret.

---

## Security

- JWT authentication for all protected endpoints.
- bcrypt password hashing (passwords never returned in responses).
- `is_active = false` accounts receive `403` on login and subsequent protected calls.
- Rental contact details (phone, email, pickup coordinates) are gated server-side — absent from JSON pre-acceptance, not just hidden in the UI.
- Admin routes gated by a separate `requireAdmin` middleware (`is_admin = true`).
- Supabase service role key lives only in backend environment variables.

---

## Future Scope

- Multiple image upload support for assets (currently accepts a single public image URL).
- In-app chat between owner and borrower during negotiation.
- Dispute resolution workflow (the admin overview already reserves a `totalDisputes` slot).
- Real-time activity feed via WebSocket (currently a polling endpoint).
- True server-side rental search (the admin rentals search currently filters only within the fetched page).

---

## Project Highlights

- Full-stack web application with React + Node.js + PostgreSQL
- 46 REST API endpoints across 8 modules
- Complete rental lifecycle with price negotiation, cancellation policy, and security deposit
- Location-based asset discovery (haversine formula, optional Google Maps)
- Admin portal with live presence, analytics charts, and platform activity feed
- Wishlist with optimistic UI updates
- Contact & pickup location reveal gated by rental status
- JWT authentication, bcrypt hashing, MVC architecture
- Deployed on Vercel + Render + Supabase
