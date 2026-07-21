# LendLoop Frontend

A modern, responsive React frontend for **LendLoop**, a location-based peer-to-peer rental platform where people rent and lend underutilized items in their community (cameras, laptops, tools, books, sports gear, and more).

The UI is styled to feel like Airbnb / OLX: white background, green primary color, rounded cards, soft shadows, and clean professional typography (Plus Jakarta Sans).

> **This app contains ONLY the frontend.** It consumes the LendLoop REST API. No backend, database, or server logic lives here.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite |
| Router | TanStack Start (file-based, type-safe routes — plays the React Router role) |
| HTTP | Axios (single shared instance with JWT interceptors) |
| Styling | Design-token CSS (green/white theme) in `src/styles.css` |
| Icons | lucide-react |
| Toasts | sonner |
| Charts | recharts (used by admin analytics pages) |
| Maps | Google Maps JavaScript API (optional, degrades gracefully) |
| Package manager | bun or npm |

---

## Getting Started

```bash
bun install        # or npm install
bun run dev        # or npm run dev
```

### Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the LendLoop backend | `http://localhost:3001` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JS API browser key | *(empty — maps show a fallback list view / manual coordinates)* |

All API URLs derive from a **single config file**: `src/api/config.ts`. No URL is hardcoded anywhere else.

---

## Project Structure

```
lendloop-frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── config.ts          # Base URL + endpoint map (auth, assets, rentals, reviews,
│   │   │                      #   notifications, dashboard, wishlist, admin)
│   │   └── api.ts             # Axios instance + JWT interceptors + 401 redirect
│   ├── assets/
│   │   └── hero.png           # Landing page hero image
│   ├── components/
│   │   ├── Navbar.tsx                    # Top nav (shows Admin link for is_admin users)
│   │   ├── Footer.tsx
│   │   ├── AssetCard.tsx                 # Asset card with wishlist heart, usage count
│   │   ├── AssetCardSkeleton.tsx         # [Admin/Browse] Skeleton placeholder grid
│   │   ├── AssetForm.tsx                 # Shared create/edit asset form
│   │   ├── LocationPicker.tsx            # Google Maps / manual coordinate picker
│   │   ├── Modal.tsx
│   │   ├── Loader.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── Pagination.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── RentalCard.tsx                # Rental card (adapts by role + status)
│   │   ├── CounterOfferModal.tsx
│   │   ├── ReviewModal.tsx
│   │   ├── StarRating.tsx
│   │   ├── WishlistButton.tsx            # [Wishlist] Heart icon, optimistic toggle
│   │   ├── CancellationPolicyBadge.tsx   # [Wishlist/Deposit] Policy info badge
│   │   ├── DepositBadge.tsx              # [Wishlist/Deposit] Deposit status badge
│   │   ├── CancelRentalModal.tsx         # [Wishlist/Deposit] Cancel with refund preview
│   │   ├── DepositResolutionModal.tsx    # [Wishlist/Deposit] Resolve deposit (owner)
│   │   ├── PresenceBadge.tsx             # [Admin] ONLINE / RECENTLY_ACTIVE / OFFLINE dot
│   │   └── admin/
│   │       └── StatCard.tsx              # [Admin] Stat tile (label, value, icon)
│   ├── context/
│   │   ├── AuthContext.tsx               # JWT + user state, localStorage persistence
│   │   └── WishlistContext.tsx           # [Wishlist] Saved asset IDs, optimistic toggle
│   ├── hooks/
│   │   └── ...                           # Shared custom hooks
│   ├── routes/                           # File-based pages (TanStack Start)
│   │   ├── index.tsx                     # Landing page
│   │   ├── register.tsx
│   │   ├── login.tsx
│   │   ├── browse.tsx                    # Browse with sort dropdown + skeleton loading
│   │   ├── map.tsx
│   │   ├── _authenticated.tsx            # Pathless layout — redirects to /login if not authed
│   │   ├── _authenticated.dashboard.tsx
│   │   ├── _authenticated.create-asset.tsx
│   │   ├── _authenticated.edit-asset.$id.tsx
│   │   ├── _authenticated.assets.$id.tsx
│   │   ├── _authenticated.wishlist.tsx   # [Wishlist] Saved assets page
│   │   ├── _authenticated.requests.tsx
│   │   ├── _authenticated.history.tsx
│   │   ├── _authenticated.notifications.tsx
│   │   ├── _authenticated.profile.tsx
│   │   ├── admin.tsx                     # [Admin] Layout: sidebar/mobile menu + access guard
│   │   ├── admin.index.tsx               # [Admin] Overview: stat cards + charts + activity
│   │   ├── admin.users.tsx               # [Admin] Users list
│   │   ├── admin.users.$userId.tsx       # [Admin] User detail
│   │   ├── admin.assets.tsx              # [Admin] Assets list
│   │   ├── admin.rentals.tsx             # [Admin] Rentals list
│   │   ├── admin.reviews.tsx             # [Admin] Reviews list
│   │   ├── admin.activity.tsx            # [Admin] Platform activity feed
│   │   ├── admin.analytics.tsx           # [Admin] Analytics charts
│   │   └── routeTree.gen.ts             # Auto-generated route tree (hand-merged)
│   ├── services/
│   │   ├── authService.ts
│   │   ├── assetService.ts
│   │   ├── rentalService.ts
│   │   ├── reviewService.ts
│   │   ├── notificationService.ts
│   │   ├── dashboardService.ts
│   │   ├── wishlistService.ts            # [Wishlist] Save / remove / list / list-ids
│   │   └── adminService.ts              # [Admin] All admin API calls
│   ├── styles.css                        # Design system (tokens, utilities)
│   └── utils/
│       ├── types.ts                      # All TypeScript interfaces (including admin types)
│       ├── formatters.ts                 # Currency, date, distance formatting
│       ├── cancellationPolicy.ts         # [Wishlist/Deposit] Refund estimation logic
│       ├── googleMapsLoader.ts           # Lazy Maps API script loader
│       └── rentalEnrichment.ts          # Contact/location enrichment helpers
├── .env.example
├── vite.config.ts
├── tsconfig.json
├── components.json                       # shadcn/ui config
└── vercel.json                           # SPA rewrite rules for Vercel
```

> **[Admin]** markers = added for admin portal. **[Wishlist/Deposit]** = added for wishlist + cancellation policy + deposit features.

---

## Pages & Routes

### Public Routes (no auth required)

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Hero, search bar, popular categories, featured assets, "Why LendLoop" section, footer |
| `/register` | Registration | Full registration form with client-side validation |
| `/login` | Login | Login form with remember-me |
| `/browse` | Browse Assets | Search, filters (category, distance, price range, availability), sort dropdown, skeleton-loading grid, pagination |
| `/assets/:id` | Asset Details | Image, owner, price, negotiable badge, availability, cancellation policy info, deposit badge, wishlist heart, request-rental modal with refund preview |
| `/map` | Map View | Nearby assets as Google Maps markers with popups (image, title, price, distance), radius selector (5–50 km), "My location" centering |

### Authenticated Routes 🔒

Protected by a pathless `_authenticated` layout that redirects unauthenticated visitors to `/login`.

| Route | Page | Description |
|---|---|---|
| `/dashboard` | Dashboard | Welcome, stat cards, my assets, recent activity, notifications |
| `/create-asset` | Create Listing | Image URL, pricing, negotiable toggle, security deposit, cancellation policy, availability, Google Maps location picker |
| `/edit-asset/:id` | Edit Listing | Same form as create, pre-filled; also allows soft-delete |
| `/wishlist` | Saved Assets | Grid of wishlisted items, remove via the heart icon |
| `/requests` | Rental Requests | Incoming & outgoing requests — accept / reject / counter offer / cancel (with cancellation policy refund preview) |
| `/history` | Rental History | Active / completed / cancelled tabs; deposit status; owner deposit resolution; contact/location reveal |
| `/notifications` | Notifications | Notification list + mark as read |
| `/profile` | Profile | Details, trust score, average rating, reviews, stats |

### Admin Routes 🛡️

Accessible at `/admin/*`. The `admin.tsx` layout does its own auth/role check — it is **not** nested under `_authenticated`.

**Access guard behavior:**
1. Auth session still hydrating → full-page Loader.
2. Not authenticated → redirect to `/login`.
3. Authenticated but `user.is_admin` is falsy → in-place "Admin access required" screen (not a redirect), with a link back to `/`.
4. Otherwise → renders the admin sidebar (desktop) / slide-out menu (mobile) with 7 nav items.

| Route | Page | Description |
|---|---|---|
| `/admin` | Overview | Stat cards (users, assets, rentals, reviews, disputes), 14-day rental growth chart, latest activity feed |
| `/admin/users` | Users List | Search, active/deactivated filter, sort by multiple fields, presence badge per row |
| `/admin/users/:userId` | User Detail | Profile, assets listed, rentals given/taken, reviews received/given, recent notifications, activate/deactivate action |
| `/admin/assets` | Assets List | Search, category filter, sort, hide/unhide toggle, remove action |
| `/admin/rentals` | Rentals List | Status filter, search (same-page only), owner/borrower/asset columns |
| `/admin/reviews` | Reviews List | Min-rating filter, delete action |
| `/admin/activity` | Activity Feed | Platform activity feed, filterable by event type, paginated |
| `/admin/analytics` | Analytics | Charts: new users/day, rental growth/day, most-rented categories (pie), rentals by status, top assets/owners/borrowers |

---

## Authentication Flow

1. `POST /api/auth/register` or `POST /api/auth/login` returns `{ user, token }`.
2. Token + user object are stored in **localStorage** (`lendloop_token`, `lendloop_user`).
3. The shared Axios instance (`src/api/api.ts`) **automatically attaches** `Authorization: Bearer <token>` to every request.
4. On any `401` response, the session is cleared and the user is redirected to `/login`.
5. `AuthContext` exposes `user`, `isAuthenticated`, `login`, `register`, `logout`, `refreshProfile` to the whole app.
6. `user.is_admin` is read from the stored user object to conditionally show the Admin nav link (desktop nav, mobile slide-out, account dropdown).

---

## API Integration

Every backend call goes through a typed service layer:

| Service | Functions |
|---|---|
| `authService` | `register`, `login`, `profile` |
| `assetService` | `list`, `search`, `nearby`, `getById`, `create`, `update`, `delete` (+ `cancellationPolicy` field) |
| `rentalService` | `createRequest`, `counterOffer`, `accept`, `reject`, `cancel` (with reason), `start`, `complete`, `resolveDeposit`, `history`, `getById` |
| `reviewService` | `createReview`, `getReviewsForUser` |
| `notificationService` | `list`, `markAsRead` |
| `dashboardService` | `overview`, `trendingCategories`, `trendingAssets`, `recentRentals`, `analytics` |
| `wishlistService` | `list`, `listIds`, `add`, `remove` |
| `adminService` | `getAdminOverview`, `getAdminAnalytics`, `getActivityFeed`, `listAdminUsers`, `getAdminUserDetail`, `setAdminUserStatus`, `listAdminAssets`, `setAdminAssetHidden`, `removeAdminAsset`, `listAdminRentals`, `listAdminReviews`, `deleteAdminReview` |

All responses follow the backend envelope `{ success, message, data, errors }`. `getApiError()` converts any failure (validation array, message string, or network error) into a readable toast.

Every page handles three UI states: **loading** (spinner or skeleton), **error** (retryable error card), and **empty** (friendly empty state message).

---

## Key Features

### Cancellation Policy

Each listing has a **Flexible / Moderate / Strict** cancellation policy set via `AssetForm.tsx`. It's shown as an expandable info card on the asset detail page and inside the booking modal. `utils/cancellationPolicy.ts` computes a live **refund-percentage preview** before the borrower even books.

Cancelling (on `/requests` or `/history`) opens `CancelRentalModal`, which shows:
- The computed refund amount based on the snapshotted policy + days-until-start.
- An optional reason field.
- An **owner cancelling always recommends 100% refund** regardless of policy.

### Security Deposit

`DepositBadge` and `DepositSummary` show a rental's deposit status everywhere it's relevant (asset page, booking modal, request/history cards).

Once a rental completes with a `HELD` deposit, the **owner sees a "Resolve security deposit" action** opening `DepositResolutionModal` (refund in full / partially / forfeit, with notes for the borrower).

> LendLoop has no payment gateway wired in — deposit/refund amounts are recorded guidance for the two parties to settle directly, not money moved automatically.

### Wishlist

`WishlistContext` loads the current user's saved asset IDs once after login and exposes an optimistic `toggle()`. `WishlistButton` (heart icon) is wired into `AssetCard` and the asset detail page — it flips instantly on tap and only reverts if the request fails.

The `/wishlist` page and the navbar's heart badge both reflect the same shared state.

### Browse Sort

The browse page (`/browse`) includes a **sort dropdown** (Relevance / Recently added / Most rented / Highest rated / Price asc / Price desc), applied client-side over the current result page via `useMemo`. The existing map, geolocation, distance filter, and category filter logic is untouched.

### Skeleton Loading

`AssetCardSkeleton` and `AssetCardSkeletonGrid` replace the plain spinner in the browse grid during loading, so the layout doesn't jump.

### Presence Badge (Admin)

`PresenceBadge` renders a small colored dot + label:
- 🟢 **ONLINE** — user was active within the last 2 minutes.
- 🟡 **RECENTLY ACTIVE** — within the last 30 minutes.
- ⚫ **OFFLINE** — older than 30 minutes, or never logged in.

Used in the admin Users list and User detail header.

### Contact & Pickup Location

Once a rental reaches `ACCEPTED`/`ACTIVE`/`COMPLETED`, `RentalCard` renders a contact card:
- The **borrower** sees the owner's name, phone, email, city/state, and an **"Open pickup location in Google Maps"** link (`https://www.google.com/maps?q=<lat>,<lng>` in a new tab — no Maps API key required).
- The **owner** sees the borrower's name, phone, email, city/state (no pickup coordinates — those belong to the owner's side).

The fields are absent from the API response entirely pre-acceptance (not just hidden in the UI).

---

## Google Maps

- **Map view (`/map`)** — nearby assets rendered as markers; clicking opens a popup with image, title, price, distance, and "Open details" button. Radius selector (5–50 km) and "My location" recentering.
- **Location picker (create/edit asset)** — tap the map to drop a pin; latitude/longitude fields stay editable manually.
- **Graceful degradation** — with no `VITE_GOOGLE_MAPS_API_KEY`, both fall back gracefully (list view / manual coordinates). The app is fully usable without any Maps API key.

---

## Forms & Validation

- Client-side validation with inline error messages (email format, password length, price sanity, date ordering, image URL format).
- Submit buttons are disabled and show progress text while a request is in flight.
- Server-side validation errors (`422` with `errors[]`) are surfaced via toasts using `getApiError()`.

---

## TypeScript Types

Key types in `src/utils/types.ts`:

| Type | Description |
|---|---|
| `User` | User profile including `is_admin?`, `last_seen?` |
| `Asset` | Asset listing including `cancellationPolicy`, `securityDeposit`, `admin_hidden` |
| `Rental` | Rental including `cancellationPolicy`, `depositStatus`, `owner_contact?`, `borrower_contact?` |
| `Review` | Review with rating and comment |
| `Notification` | Notification with type and read status |
| `WishlistItem` | Saved asset with `wishlisted_at` |
| `Presence` | `"ONLINE"` \| `"RECENTLY_ACTIVE"` \| `"OFFLINE"` |
| `CancellationPolicy` | `"FLEXIBLE"` \| `"MODERATE"` \| `"STRICT"` |
| `DepositStatus` | `"NONE"` \| `"PENDING"` \| `"HELD"` \| `"REFUNDED"` \| `"PARTIALLY_REFUNDED"` \| `"FORFEITED"` |
| `AdminUser` | User with presence field for admin views |
| `AdminOverview` | Platform-wide stat card data |
| `AdminUserDetail` | Full user detail bundle |
| `AdminAsset` | Asset with `owner` field |
| `AdminRental` | Rental with `owner`, `borrower`, `asset` fields |
| `AdminReview` | Review with `reviewer`, `receiver` fields |
| `AdminAnalytics` | Charts data (growth, categories, top performers) |
| `ActivityLog` | Platform activity log entry |
| `OwnerContact` | Owner contact (with lat/lng) revealed post-acceptance |
| `BorrowerContact` | Borrower contact (without lat/lng) revealed post-acceptance |

---

## Design System

`src/styles.css` defines:
- CSS custom properties (color tokens, spacing, radii).
- Utility classes: `card-elevated`, `btn-primary`, `btn-secondary`, etc.
- Responsive layout utilities.
- The same classes are used across both the main app and admin portal — no re-theming was needed.

Typography: **Plus Jakarta Sans** (via Google Fonts).

---

## Notes

- Image "upload" accepts a public image URL — the backend stores `imageUrl` and shows a live preview in the form.
- Prices are displayed in **₹ (Indian locale formatting)**.
- Rental cards adapt their available actions to your role (owner vs borrower) and the current rental status, mirroring the backend state machine: `REQUESTED → NEGOTIATING → ACCEPTED → ACTIVE → COMPLETED` (or `REJECTED`/`CANCELLED`).
- The admin section uses the same shared components (`Loader`, `EmptyState`, `ErrorState`, `Pagination`) and design tokens as the main app — no new styling framework was introduced.
- `recharts` (used by admin analytics) was already in `package.json` before the admin merge.
- The `/wishlist` route registration was also fixed in `routeTree.gen.ts` during the admin merge — it existed as a route file but was missing from the generated tree.

---

## Environment Variable Reference

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | — | Backend URL. Default `http://localhost:3001`. Set to production URL for deployed builds. |
| `VITE_GOOGLE_MAPS_API_KEY` | — | Optional. Leave empty — app works fully with Leaflet/OpenStreetMap fallback. |

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |

`vercel.json` includes SPA rewrite rules so all routes resolve to `index.html`.

No new environment variables are required for the admin portal or wishlist/deposit features.
