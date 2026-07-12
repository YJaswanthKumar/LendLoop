# LendLoop — Frontend

A modern, responsive React frontend for **LendLoop**, a location-based peer-to-peer rental platform where people rent and lend underutilized items in their community (cameras, laptops, tools, books, sports gear and more).

The UI is built to feel like Airbnb / OLX: white background, green primary color, rounded cards, soft shadows, and a clean professional typography (Plus Jakarta Sans).

> **This repository contains ONLY the frontend.** It consumes an existing, already-deployed LendLoop REST API. No backend, database, or server logic lives here.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite (TanStack Start file-based router — plays the React Router role with type-safe routes) |
| HTTP | Axios (single shared instance with JWT interceptors) |
| Styling | Design-token CSS (green/white theme) in `src/styles.css` |
| Icons | lucide-react |
| Toasts | sonner |
| Maps | Google Maps JavaScript API (optional, degrades gracefully) |

---

## Getting Started

```bash
bun install        # or npm install
bun run dev        # or npm run dev
```

### Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the LendLoop backend | `http://localhost:5000` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JS API browser key | *(empty — maps show a fallback)* |

All API URLs derive from a **single config file**: [`src/api/config.ts`](src/api/config.ts). No URL is hardcoded anywhere else.

---

## Project Structure

```
src/
├── api/            # config.ts (base URL + endpoint map), api.ts (Axios instance + interceptors)
├── assets/         # images (hero)
├── components/     # Navbar, Footer, AssetCard, AssetForm, LocationPicker, Modal,
│                   # Loader, EmptyState, ErrorState, Pagination, StatusBadge,
│                   # RentalCard, CounterOfferModal, ReviewModal, StarRating
├── context/        # AuthContext (JWT + user, localStorage persistence)
├── hooks/          # shared hooks
├── routes/         # pages (file-based routing)
├── services/       # authService, assetService, rentalService, reviewService,
│                   # notificationService, dashboardService
├── styles.css      # design system (tokens, utilities)
└── utils/          # types, formatters, Google Maps loader, rental enrichment
```

---

## Pages

| Route | Page | Auth |
|---|---|---|
| `/` | Landing — hero, search, popular categories, featured assets, "Why LendLoop", footer | — |
| `/register` | Registration with client-side validation | — |
| `/login` | Login with remember-me | — |
| `/browse` | Browse assets — search, filters (category, distance, price range, availability), grid, pagination | — |
| `/assets/:id` | Asset details — image, owner price, negotiable badge, availability, request-rental modal | — |
| `/map` | Map view — nearby assets as Google Maps markers with popups (image, title, price, distance, open details) | — |
| `/dashboard` | Welcome, statistics cards, my assets, recent activity, notifications | 🔒 |
| `/create-asset` | Create listing — image, pricing, negotiable toggle, deposit, availability, Google Maps location picker | 🔒 |
| `/edit-asset/:id` | Edit/delete listing (same form) | 🔒 |
| `/requests` | Incoming & outgoing rental requests — accept / reject / counter offer / cancel | 🔒 |
| `/history` | Rental history — active / completed / cancelled tabs | 🔒 |
| `/notifications` | Notification list + mark as read | 🔒 |
| `/profile` | Profile — details, trust score, ratings, reviews, stats | 🔒 |

Protected pages live under a pathless `_authenticated` layout that redirects unauthenticated visitors to `/login`.

---

## Authentication Flow

1. `POST /api/auth/register` or `POST /api/auth/login` returns `{ user, token }`.
2. Token + user are stored in **localStorage** (`lendloop_token`, `lendloop_user`).
3. The shared Axios instance (`src/api/api.ts`) **automatically attaches** `Authorization: Bearer <token>` to every request.
4. On any `401` response the session is cleared and the user is redirected to `/login`.
5. `AuthContext` exposes `user`, `isAuthenticated`, `login`, `register`, `logout`, `refreshProfile` to the whole app.

---

## API Integration

Every backend call goes through a thin, typed service layer:

- `authService` — register, login, profile
- `assetService` — list / search / nearby / CRUD
- `rentalService` — create request, counter offer, accept, reject, cancel, complete, history
- `reviewService` — create review, reviews for a user
- `notificationService` — list, mark as read
- `dashboardService` — overview, trending, recent rentals, analytics

All responses follow the backend envelope `{ success, message, data, errors }`; `getApiError()` converts any failure (validation array, message, or network error) into a readable toast.

Every page handles the three UI states: **loading** (spinner), **error** (retryable error card), and **empty** (friendly empty state).

---

## Google Maps

- **Map view (`/map`)** — nearby assets (via `GET /api/assets/nearby` and browser geolocation) rendered as markers; clicking one opens a popup with image, title, price/day, distance and an "Open details" button. Radius selector (5–50 km) and "My location" recentering, Uber-style.
- **Location picker (create/edit asset)** — tap the map to drop a pin; latitude/longitude fields stay editable manually.
- With no `VITE_GOOGLE_MAPS_API_KEY`, both fall back gracefully (list view / manual coordinates) so the app remains fully usable.

---

## Forms & Validation

- Client-side validation with inline error messages (email format, password length, price sanity, date ordering, image URL format).
- Submit buttons are disabled and show progress text while a request is in flight.
- Server-side validation errors (`422` with `errors[]`) are surfaced via toasts.

## Notes

- Image "upload" accepts a public image URL (the backend stores `imageUrl`); preview is shown live in the form.
- Prices are displayed in ₹ (Indian locale formatting).
- Rental cards adapt their actions to your role (owner vs borrower) and rental status, mirroring the backend state machine: `REQUESTED → NEGOTIATING → ACCEPTED → ACTIVE → COMPLETED` (or `REJECTED`/`CANCELLED`).
