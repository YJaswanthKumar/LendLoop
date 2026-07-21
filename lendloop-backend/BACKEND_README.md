# LendLoop Backend

Community Asset Sharing & Rental Platform — REST API built with **Node.js**, **Express.js**, and **Supabase PostgreSQL**.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20.19+ (18+ minimum for backend alone) |
| Framework | Express.js |
| Database | Supabase PostgreSQL (via `@supabase/supabase-js`, no ORM) |
| Auth | JWT (jsonwebtoken) + bcrypt password hashing |
| Validation | express-validator |
| Architecture | MVC + Service Layer: Routes → Controllers → Services → Supabase |
| Dev tooling | nodemon |

---

## Project Structure

```
lendloop-backend/
├── src/
│   ├── config/
│   │   ├── env.js                      # Environment variable loader/validator
│   │   └── supabase.js                 # Supabase client (service role)
│   ├── controllers/                    # HTTP request/response handlers
│   │   ├── auth.controller.js
│   │   ├── asset.controller.js
│   │   ├── rental.controller.js
│   │   ├── review.controller.js
│   │   ├── notification.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── wishlist.controller.js
│   │   └── admin.controller.js         # [Admin] Admin API handlers
│   ├── services/                       # Business logic + Supabase queries
│   │   ├── auth.service.js
│   │   ├── asset.service.js
│   │   ├── rental.service.js
│   │   ├── review.service.js
│   │   ├── notification.service.js
│   │   ├── dashboard.service.js
│   │   ├── wishlist.service.js
│   │   ├── admin.service.js            # [Admin] Platform-wide queries
│   │   └── activity.service.js         # [Admin] Fire-and-forget activity log
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── asset.routes.js
│   │   ├── rental.routes.js
│   │   ├── review.routes.js
│   │   ├── notification.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── wishlist.routes.js
│   │   └── admin.routes.js             # [Admin] /api/admin/* routes
│   ├── middleware/
│   │   ├── auth.middleware.js          # JWT verification + last_seen heartbeat
│   │   ├── admin.middleware.js         # [Admin] requireAdmin guard
│   │   ├── validation.middleware.js    # express-validator result handler
│   │   └── error.middleware.js         # Centralized error handling + AppError
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── asset.validator.js
│   │   ├── rental.validator.js
│   │   ├── review.validator.js
│   │   ├── notification.validator.js
│   │   ├── wishlist.validator.js
│   │   └── admin.validator.js          # [Admin] Admin route validators
│   ├── utils/
│   │   ├── response.js                 # success() / failure() JSON helpers
│   │   ├── constants.js                # Enum constants (statuses, types)
│   │   └── helpers.js                  # JWT, pagination, haversine, sanitizers
│   ├── app.js                          # Express app + middleware pipeline
│   └── server.js                       # Server bootstrap
├── sql/
│   ├── 001_initial_schema.sql          # Core schema (users, assets, rentals, reviews, notifications)
│   └── 002_admin_features.sql          # [Admin] Migration: is_admin, last_seen, admin_hidden, activity_logs
├── package.json
└── .env.example
```

> **[Admin]** markers indicate files added for the admin portal feature.

---

## Setup & Run

### Prerequisites

- Node.js 20.19+ (18+ minimum)
- A Supabase project with the LendLoop schema already created

### Steps

```bash
cd lendloop-backend
npm install
cp .env.example .env
```

Fill in `.env`:

```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5000
```

> Use the **service role key** (not the anon key) — the backend talks to Supabase directly with full access and enforces authorization itself via JWT. Never expose this key in frontend code.

```bash
npm run dev     # nodemon, auto-restart on file changes
npm start       # plain node
```

Server boots on `http://localhost:3001` (or your `PORT`).

### Health Check

```
GET /health
```
```json
{ "success": true, "message": "LendLoop API is healthy", "data": { "uptime": 12.34 } }
```

---

## Admin Portal — One-time Setup

After deploying or running for the first time, run the admin migration and promote your admin user:

```bash
# 1. Run the migration in your Supabase SQL editor (or psql)
#    File: lendloop-backend/sql/002_admin_features.sql
#    It is idempotent (IF NOT EXISTS throughout) — safe to re-run.

# 2. Promote your account to admin
UPDATE users SET is_admin = TRUE WHERE email = 'your@email.com';
```

If the migration has **not** been run:
- Core browsing (`GET /api/assets`, `/search`, `/nearby`) works fine — these endpoints detect the missing `admin_hidden` column and skip that filter gracefully.
- Admin routes (`/api/admin/*`) return a clear **503** telling you to run the migration instead of a raw 500.

---

## Response Format

**Success**
```json
{ "success": true, "message": "Human readable message", "data": {} }
```

**Failure**
```json
{ "success": false, "message": "Human readable message", "errors": [] }
```

**Validation failure (422)** — `errors` is populated with one entry per invalid field:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email must be valid" }
  ]
}
```

### Common HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / business rule violation |
| 401 | Missing/invalid/expired token, wrong credentials |
| 403 | Authenticated but not authorized for this resource |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, duplicate review) |
| 422 | Validation failed |
| 500 | Server/database error |
| 503 | Admin migration not applied |

---

## Global Enums

```
availabilityStatus   → AVAILABLE | BOOKED | UNAVAILABLE
rental status        → REQUESTED | NEGOTIATING | ACCEPTED | ACTIVE | COMPLETED | REJECTED | CANCELLED
cancellationPolicy   → FLEXIBLE | MODERATE | STRICT
depositStatus        → NONE | PENDING | HELD | REFUNDED | PARTIALLY_REFUNDED | FORFEITED
notification type    → REQUEST | COUNTER_OFFER | ACCEPTED | REJECTED | ACTIVE | COMPLETED |
                       CANCELLED | DEPOSIT | WISHLIST | MESSAGE | DISPUTE | GENERAL
activity log type    → USER_REGISTERED | USER_LOGIN | ASSET_LISTED | ASSET_DELETED |
                       RENTAL_REQUESTED | RENTAL_APPROVED | RENTAL_COMPLETED | REVIEW_SUBMITTED
                       (ASSET_UPDATED and NOTIFICATION_SENT are reserved but never emitted)
presence             → ONLINE | RECENTLY_ACTIVE | OFFLINE
```

---

## Database

### Core Tables (001_initial_schema.sql)

| Table | Key Columns |
|---|---|
| `users` | `id`, `full_name`, `email`, `password_hash`, `phone`, `profile_image`, `city`, `state`, `country`, `latitude`, `longitude`, `trust_score`, `average_rating`, `rentals_completed`, `rentals_taken`, `total_assets`, `is_verified`, `is_active` |
| `assets` | `id`, `owner_id`, `title`, `category`, `description`, `brand`, `condition`, `purchase_year`, `expected_price_per_day`, `minimum_price`, `price_negotiable`, `security_deposit`, `cancellation_policy`, `availability_status`, `available_from`, `available_to`, `latitude`, `longitude`, `address`, `city`, `state`, `country`, `image_url`, `usage_count`, `average_rating`, `is_active` |
| `rentals` | `id`, `asset_id`, `owner_id`, `borrower_id`, `request_date`, `start_date`, `end_date`, `total_days`, `expected_price`, `offered_price`, `counter_offer_price`, `agreed_price`, `security_deposit`, `cancellation_policy`, `deposit_status`, `owner_message`, `borrower_message`, `status`, `cancelled_by`, `cancellation_reason`, `cancelled_at`, `refund_amount` |
| `reviews` | `id`, `rental_id`, `reviewer_id`, `receiver_id`, `rating`, `review` |
| `notifications` | `id`, `user_id`, `title`, `message`, `type`, `is_read` |

### Admin Extension Tables (002_admin_features.sql)

| Table/Column | Type | Notes |
|---|---|---|
| `users.is_admin` | boolean, default `false` | Gate for `requireAdmin` middleware |
| `users.last_seen` | timestamp, nullable | Updated fire-and-forget on every authenticated request; drives presence |
| `assets.admin_hidden` | boolean, default `false` | Admin-only visibility flag, independent of `is_active` |
| `activity_logs` | table | `id`, `type`, `message`, `user_id` (nullable, `ON DELETE SET NULL`), `meta` (jsonb), `created_at` |

### Entity Relationships

| Parent | Child | Relationship |
|---|---|---|
| `users` | `assets` | One User → Many Assets (owner_id) |
| `users` | `rentals` | One User → Many Rentals (owner_id / borrower_id) |
| `assets` | `rentals` | One Asset → Many Rental Requests |
| `rentals` | `reviews` | One Rental → Multiple Reviews (one per participant) |
| `users` | `reviews` | One User → Many Reviews (reviewer_id / receiver_id) |
| `users` | `notifications` | One User → Many Notifications |

### Rental Status Flow

```
REQUESTED → NEGOTIATING → ACCEPTED → ACTIVE → COMPLETED
    │
    ├──────► REJECTED
    └──────► CANCELLED
```

### Presence Calculation (Admin)

Computed on the fly from `users.last_seen` (never stored separately):

| Value | Condition |
|---|---|
| `ONLINE` | `last_seen` within the last 2 minutes |
| `RECENTLY_ACTIVE` | `last_seen` within the last 30 minutes |
| `OFFLINE` | `last_seen` older than 30 minutes, or `null` |

---

## Business Rules Enforced

- Email uniqueness enforced at registration.
- Passwords stored only as bcrypt hashes, never returned in responses.
- Only asset owners can update/delete their assets.
- Users cannot rent their own assets, and cannot wishlist their own listings.
- Rentals start in `REQUESTED`; price negotiation only allowed if `price_negotiable` is true on the asset.
- An asset's `cancellationPolicy` (`FLEXIBLE` / `MODERATE` / `STRICT`, default `MODERATE`) is snapshotted onto each rental at request time, so edits to the listing never change the terms of a rental already in flight.
- Cancelling computes a recommended refund from the snapshotted policy and days-until-start. An owner cancelling always recommends a full refund. LendLoop has no payment gateway — this is recorded guidance, not a processed transaction.
- If an asset has a `securityDeposit`, the rental's `depositStatus` moves `PENDING → HELD` once accepted. A `HELD` deposit is auto-`REFUNDED` on cancellation (rental never happened). Once `COMPLETED`, only the owner can resolve a `HELD` deposit (`PATCH /:id/deposit`).
- Reviews only allowed after a rental reaches `COMPLETED`, one review per reviewer per rental.
- `average_rating` recalculated whenever a review is added or (admin) deleted.
- `usage_count` increments on rental completion; `total_assets` updates on asset create/delete.
- Nearby search computed via the haversine formula over stored `latitude`/`longitude`.
- Rental pickup start must be explicitly confirmed by the owner (`PATCH /:id/start`, `ACCEPTED → ACTIVE`) before the rental can be completed — prevents marking complete before handover.
- Contact info & pickup coordinates are revealed only once a rental reaches `ACCEPTED`/`ACTIVE`/`COMPLETED` (server-side gate, not just UI).
- Admin can deactivate any user. A deactivated admin will receive `403` on subsequent admin calls — no self-lock-out protection exists.

---

## Security

- JWT token authentication for all protected endpoints.
- Bearer token required: `Authorization: Bearer <token>`.
- Passwords stored as bcrypt hashes only.
- `is_active = false` accounts receive `403 This account has been deactivated` on login and protected calls.
- Ownership verified before asset update/delete operations.
- Rental details (including contact info) restricted to rental owner/borrower only — third parties receive `403`.
- Admin routes additionally require `is_admin = true` — separate middleware `requireAdmin`.
- All admin response objects strip `password_hash` before returning.
- Supabase service role key must never be used in frontend code.

---

## Full Endpoint Index

🔒 = requires `Authorization: Bearer <token>` | 🛡️ = additionally requires `is_admin = true`

| Module | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| Health | GET | `/health` | — | Server health check |
| **Auth** | POST | `/api/auth/register` | — | Register new user |
| Auth | POST | `/api/auth/login` | — | Login, returns JWT |
| Auth | GET | `/api/auth/profile` | 🔒 | Get current user profile |
| **Assets** | POST | `/api/assets` | 🔒 | Create asset listing |
| Assets | GET | `/api/assets` | — | List assets (paginated, filterable) |
| Assets | GET | `/api/assets/nearby` | — | Nearby assets by lat/lng (haversine) |
| Assets | GET | `/api/assets/search` | — | Search assets by keyword |
| Assets | GET | `/api/assets/:id` | — | Get asset by ID |
| Assets | PUT | `/api/assets/:id` | 🔒 owner | Update asset |
| Assets | DELETE | `/api/assets/:id` | 🔒 owner | Soft-delete asset |
| **Rentals** | POST | `/api/rentals` | 🔒 | Create rental request |
| Rentals | GET | `/api/rentals/history` | 🔒 | Rental history (role/status filters) |
| Rentals | GET | `/api/rentals/:id` | 🔒 participant | Get rental details |
| Rentals | PATCH | `/api/rentals/:id/counter-offer` | 🔒 owner | Submit counter offer |
| Rentals | PATCH | `/api/rentals/:id/accept` | 🔒 participant | Accept offer |
| Rentals | PATCH | `/api/rentals/:id/reject` | 🔒 participant | Reject offer |
| Rentals | PATCH | `/api/rentals/:id/cancel` | 🔒 participant | Cancel rental |
| Rentals | PATCH | `/api/rentals/:id/start` | 🔒 owner | Mark as active (pickup confirmed) |
| Rentals | PATCH | `/api/rentals/:id/complete` | 🔒 participant | Mark as completed |
| Rentals | PATCH | `/api/rentals/:id/deposit` | 🔒 owner | Resolve security deposit |
| **Reviews** | POST | `/api/reviews` | 🔒 | Submit review (COMPLETED rentals only) |
| Reviews | GET | `/api/reviews/user/:userId` | — | Get reviews for a user |
| **Notifications** | POST | `/api/notifications` | 🔒 | Create notification |
| Notifications | GET | `/api/notifications` | 🔒 | List notifications |
| Notifications | PATCH | `/api/notifications/:id/read` | 🔒 owner | Mark as read |
| **Dashboard** | GET | `/api/dashboard/overview` | 🔒 | Personal stats overview |
| Dashboard | GET | `/api/dashboard/trending-categories` | 🔒 | Categories by usage |
| Dashboard | GET | `/api/dashboard/trending-assets` | 🔒 | Top assets |
| Dashboard | GET | `/api/dashboard/recent-rentals` | 🔒 | Recent rentals |
| Dashboard | GET | `/api/dashboard/analytics` | 🔒 | Status breakdown + earnings |
| **Wishlist** | GET | `/api/wishlist` | 🔒 | List saved assets |
| Wishlist | GET | `/api/wishlist/ids` | 🔒 | Saved asset IDs only |
| Wishlist | POST | `/api/wishlist` | 🔒 | Save an asset |
| Wishlist | DELETE | `/api/wishlist/:assetId` | 🔒 | Remove saved asset |
| **Admin** | GET | `/api/admin/overview` | 🛡️ | Platform-wide stat cards |
| Admin | GET | `/api/admin/analytics` | 🛡️ | Charts data (growth, categories, top performers) |
| Admin | GET | `/api/admin/activity` | 🛡️ | Platform activity feed (paginated, filterable) |
| Admin | GET | `/api/admin/users` | 🛡️ | Users list (search, filter, sort, paginate) |
| Admin | GET | `/api/admin/users/:userId` | 🛡️ | Full user detail bundle |
| Admin | PATCH | `/api/admin/users/:userId/status` | 🛡️ | Activate/deactivate user |
| Admin | GET | `/api/admin/assets` | 🛡️ | Assets list with owner info |
| Admin | PATCH | `/api/admin/assets/:assetId/hidden` | 🛡️ | Hide/unhide listing |
| Admin | DELETE | `/api/admin/assets/:assetId` | 🛡️ | Remove listing (soft delete) |
| Admin | GET | `/api/admin/rentals` | 🛡️ | Rentals list with participants |
| Admin | GET | `/api/admin/reviews` | 🛡️ | Reviews list |
| Admin | DELETE | `/api/admin/reviews/:reviewId` | 🛡️ | Delete review (recalculates rating) |

---

## API Reference — Standard Routes

### 1. Authentication — `/api/auth`

#### `POST /api/auth/register`

**Body**
```json
{
  "fullName": "Asha Rao",
  "email": "asha@example.com",
  "password": "SecurePass123",
  "phone": "9876543210",
  "city": "Hyderabad",
  "state": "Telangana",
  "country": "India",
  "latitude": 17.385,
  "longitude": 78.4867
}
```
`phone`, `city`, `state`, `country`, `latitude`, `longitude` are optional.

**Response `201`**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "b1e7c2a0-...",
      "full_name": "Asha Rao",
      "email": "asha@example.com",
      "phone": "9876543210",
      "profile_image": null,
      "city": "Hyderabad",
      "state": "Telangana",
      "country": "India",
      "latitude": 17.385,
      "longitude": 78.4867,
      "trust_score": 0,
      "average_rating": 0,
      "rentals_completed": 0,
      "rentals_taken": 0,
      "total_assets": 0,
      "is_verified": false,
      "is_active": true,
      "created_at": "2026-07-11T10:00:00.000Z",
      "updated_at": "2026-07-11T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```
**Errors**: `409` email already registered · `422` validation (weak password, invalid email, etc.)

Side effect: fires a `USER_REGISTERED` activity log entry.

---

#### `POST /api/auth/login`

**Body**
```json
{ "email": "asha@example.com", "password": "SecurePass123" }
```

**Response `200`**
```json
{
  "success": true,
  "message": "Login successful",
  "data": { "user": { "...": "same shape as register" }, "token": "eyJhbGciOiJIUzI1NiIs..." }
}
```
**Errors**: `401` invalid email/password · `403` account deactivated

Side effect: fires a `USER_LOGIN` activity log entry; updates `last_seen`.

---

#### `GET /api/auth/profile` 🔒

**Response `200`**
```json
{ "success": true, "message": "Profile fetched successfully", "data": { "user": { "...": "sanitized user" } } }
```

---

### 2. Assets — `/api/assets`

#### `POST /api/assets` 🔒

**Body**
```json
{
  "title": "Canon EOS R6 Camera",
  "category": "Electronics",
  "description": "Full-frame mirrorless camera, barely used",
  "brand": "Canon",
  "condition": "Like New",
  "purchaseYear": 2023,
  "expectedPricePerDay": 1200,
  "minimumPrice": 900,
  "priceNegotiable": true,
  "securityDeposit": 5000,
  "cancellationPolicy": "MODERATE",
  "availableFrom": "2026-07-15",
  "availableTo": "2026-12-31",
  "latitude": 17.385,
  "longitude": 78.4867,
  "address": "Jubilee Hills",
  "city": "Hyderabad",
  "state": "Telangana",
  "country": "India",
  "imageUrl": "https://your-bucket.supabase.co/storage/v1/object/public/asset-images/camera.jpg"
}
```
Only `title`, `category`, `expectedPricePerDay` are required.

**Response `201`**: full asset object with all snake_case columns.

Side effect: fires an `ASSET_LISTED` activity log entry.

---

#### `GET /api/assets`

**Query params** (all optional):

| Param | Notes |
|---|---|
| `page` | default `1` |
| `limit` | default `10` |
| `category` | exact match |
| `city` | exact match |
| `minPrice` | minimum `expected_price_per_day` |
| `maxPrice` | maximum `expected_price_per_day` |
| `availabilityStatus` | `AVAILABLE` \| `BOOKED` \| `UNAVAILABLE` |

**Response `200`**
```json
{
  "success": true,
  "message": "Assets fetched successfully",
  "data": {
    "assets": [ { "...": "asset object" } ],
    "pagination": { "page": 1, "limit": 10, "totalItems": 34, "totalPages": 4 }
  }
}
```

Only returns `is_active = true` and `admin_hidden = false` assets (when migration is applied).

---

#### `GET /api/assets/nearby`

**Query params**:

| Param | Required | Notes |
|---|---|---|
| `latitude` | ✅ | Browser geolocation |
| `longitude` | ✅ | Browser geolocation |
| `radiusKm` | — | default `25` |
| `page`, `limit` | — | see above |

**Response `200`**: same shape as List Assets, but each asset also includes `"distance_km": 3.42`.

---

#### `GET /api/assets/search`

**Query params**: `q` (search term), `page`, `limit`. Matches `title`, `description`, `category`, `brand` (case-insensitive).

**Response `200`**: same shape as List Assets.

---

#### `GET /api/assets/:id`

**Response `200`**: single asset object. **Errors**: `404` not found.

---

#### `PUT /api/assets/:id` 🔒 (owner only)

**Body** (send only fields to change):
```json
{
  "expectedPricePerDay": 1000,
  "availabilityStatus": "UNAVAILABLE",
  "cancellationPolicy": "STRICT",
  "description": "Updated description"
}
```
**Response `200`**: updated asset object. **Errors**: `403` not the owner · `404` not found.

---

#### `DELETE /api/assets/:id` 🔒 (owner only, soft delete)

Sets `is_active = false`. Physical row is preserved.

**Response `200`**: `{ "success": true, "message": "Asset deleted successfully", "data": {} }`

Side effect: fires an `ASSET_DELETED` activity log entry.

---

### 3. Rentals — `/api/rentals` (all 🔒)

#### `POST /api/rentals` — Create Rental Request

**Body**
```json
{
  "assetId": "a4f1...",
  "startDate": "2026-07-20",
  "endDate": "2026-07-23",
  "offeredPrice": 3200,
  "borrowerMessage": "Would love to borrow this for a weekend shoot."
}
```

**Response `201`**
```json
{
  "success": true,
  "message": "Rental request created successfully",
  "data": {
    "rental": {
      "id": "r7c9...",
      "asset_id": "a4f1...",
      "owner_id": "b1e7c2a0-...",
      "borrower_id": "c9d2e3f4-...",
      "request_date": "2026-07-11T10:10:00.000Z",
      "start_date": "2026-07-20",
      "end_date": "2026-07-23",
      "total_days": 3,
      "expected_price": 3600,
      "offered_price": 3200,
      "counter_offer_price": null,
      "agreed_price": null,
      "security_deposit": 5000,
      "cancellation_policy": "MODERATE",
      "deposit_status": "PENDING",
      "owner_message": null,
      "borrower_message": "Would love to borrow this for a weekend shoot.",
      "status": "REQUESTED",
      "created_at": "2026-07-11T10:10:00.000Z",
      "updated_at": "2026-07-11T10:10:00.000Z"
    }
  }
}
```
**Errors**: `400` renting own asset / asset not available · `404` asset not found

The rental snapshots the asset's `cancellationPolicy` at request time. If the asset has a `securityDeposit` > 0, `depositStatus` starts at `PENDING`.

Side effect: fires a `RENTAL_REQUESTED` activity log entry.

---

#### `GET /api/rentals/:id` 🔒 (participant only)

Returns full rental object. Only the rental's `owner_id` or `borrower_id` may access it (`403` otherwise).

**Contact enrichment** — once status reaches `ACCEPTED`, `ACTIVE`, or `COMPLETED`:
```json
{
  "rental": {
    "...": "...",
    "owner_contact": {
      "full_name": "...", "email": "...", "phone": "...",
      "city": "...", "state": "...",
      "latitude": 17.385, "longitude": 78.4867
    },
    "borrower_contact": {
      "full_name": "...", "email": "...", "phone": "...",
      "city": "...", "state": "..."
    }
  }
}
```
- `owner_contact` includes `latitude`/`longitude` so the borrower can open `https://www.google.com/maps?q=<lat>,<lng>` in a new tab — no Google Maps API key required.
- `borrower_contact` does **not** include coordinates.
- These fields are **absent from the JSON entirely** pre-acceptance (server-side gate, not just UI hidden).

**Errors**: `403` not a participant · `404` not found.

---

#### `PATCH /api/rentals/:id/counter-offer` 🔒 (owner only)

**Body**: `{ "counterOfferPrice": 3400, "ownerMessage": "Best I can do is 3400." }`

**Response `200`**: rental with `status: "NEGOTIATING"`, `counter_offer_price` set.

**Errors**: `400` asset not negotiable / wrong status · `403` not the owner.

---

#### `PATCH /api/rentals/:id/accept` 🔒 (participant)

**Body** (optional): `{ "agreedPrice": 3400 }`

**Response `200`**: rental with `status: "ACCEPTED"`, `agreed_price` set. Asset's `availability_status` becomes `BOOKED`. If deposit was `PENDING`, it moves to `HELD`.

---

#### `PATCH /api/rentals/:id/reject` 🔒

**Response `200`**: rental with `status: "REJECTED"`.

---

#### `PATCH /api/rentals/:id/cancel` 🔒

**Body** (optional): `{ "reason": "My schedule changed." }`

Not allowed once status is `ACTIVE`, `COMPLETED`, `REJECTED`, or already `CANCELLED`.

**Response `200`**: rental with `status: "CANCELLED"` plus:
- `cancelled_by`, `cancellation_reason`, `cancelled_at`
- `refund_amount` — computed from `cancellation_policy` + days until `start_date`. Owner cancelling → always full refund. Borrower cancelling → policy refund ladder (e.g. `MODERATE`: 100% ≥ 3 days out, 50% within 3 days, 0% on day of pickup).
- If deposit was `HELD`, automatically set to `REFUNDED`.

---

#### `PATCH /api/rentals/:id/start` 🔒 (owner only)

Owner confirms pickup/handover. Moves rental from `ACCEPTED` → `ACTIVE`. A rental cannot be completed until it has been started.

**Response `200`**: rental with `status: "ACTIVE"`.

---

#### `PATCH /api/rentals/:id/complete` 🔒 (participant)

Valid from `ACCEPTED` or `ACTIVE`.

**Response `200`**: rental with `status: "COMPLETED"`. Side effects: asset becomes `AVAILABLE` again, `usage_count` +1, owner's `rentals_completed` +1, borrower's `rentals_taken` +1.

Side effect: fires a `RENTAL_COMPLETED` activity log entry.

---

#### `PATCH /api/rentals/:id/deposit` 🔒 (owner only)

Only valid once rental is `COMPLETED` and `deposit_status` is `HELD`.

**Body**
```json
{ "status": "PARTIALLY_REFUNDED", "refundAmount": 2500, "notes": "Minor scratch on the lens hood." }
```
- `status`: required — `REFUNDED` \| `PARTIALLY_REFUNDED` \| `FORFEITED`.
- `refundAmount`: required only when `status` is `PARTIALLY_REFUNDED`, must be between 0 and deposit amount.
- `notes`: optional.

**Response `200`**: rental with `deposit_status` updated, `deposit_refund_amount`, `deposit_notes`, `deposit_resolved_at`, `deposit_resolved_by` set. Borrower is notified.

**Errors**: `403` not the owner · `400` rental isn't `COMPLETED`, or no `HELD` deposit, or `refundAmount` out of range.

---

#### `GET /api/rentals/history`

**Query params** (all optional): `role` (`owner` \| `borrower`, omit for both), `status`, `page`, `limit`.

**Response `200`**
```json
{
  "success": true,
  "message": "Rental history fetched successfully",
  "data": {
    "rentals": [ { "...": "rental object with contact enrichment if applicable" } ],
    "pagination": { "page": 1, "limit": 10, "totalItems": 12, "totalPages": 2 }
  }
}
```

---

### 4. Reviews — `/api/reviews`

#### `POST /api/reviews` 🔒

Only allowed once the related rental is `COMPLETED`, by a participant of that rental, reviewing the other participant.

**Body**
```json
{
  "rentalId": "r7c9...",
  "receiverId": "b1e7c2a0-...",
  "rating": 4.5,
  "review": "Asset was in great condition, smooth handover."
}
```

**Response `201`**: review object. Side effect: recalculates receiver's `average_rating`. Fires a `REVIEW_SUBMITTED` activity log entry.

**Errors**: `400` rental not completed / receiver not a participant / reviewing yourself · `403` not a participant · `409` already reviewed this rental.

---

#### `GET /api/reviews/user/:userId`

**Query params**: `page`, `limit`.

**Response `200`**
```json
{
  "success": true,
  "message": "Reviews fetched successfully",
  "data": {
    "reviews": [ { "...": "review object" } ],
    "averageRating": 4.5,
    "pagination": { "page": 1, "limit": 10, "totalItems": 3, "totalPages": 1 }
  }
}
```

---

### 5. Notifications — `/api/notifications` (all 🔒)

#### `POST /api/notifications`

**Body**
```json
{
  "userId": "b1e7c2a0-...",
  "title": "New message",
  "message": "You have a new message from the borrower.",
  "type": "GENERAL"
}
```
`type` optional (defaults to `GENERAL`).

**Response `201`**: notification object.

---

#### `GET /api/notifications`

**Query params**: `isRead` (`true`/`false`), `page`, `limit`.

**Response `200`**: paginated notifications list.

---

#### `PATCH /api/notifications/:id/read`

No body required. **Response `200`**: notification with `is_read: true`. **Errors**: `403` not the owner · `404` not found.

---

### 6. Dashboard — `/api/dashboard` (all 🔒)

#### `GET /api/dashboard/overview`

**Response `200`**
```json
{
  "success": true,
  "message": "Dashboard overview fetched successfully",
  "data": {
    "overview": {
      "totalAssets": 4,
      "rentalsCompleted": 12,
      "rentalsTaken": 7,
      "trustScore": 87.5,
      "averageRating": 4.6,
      "activeRentals": 2,
      "pendingRequests": 1
    }
  }
}
```

---

#### `GET /api/dashboard/trending-categories`

**Response `200`**
```json
{
  "data": { "categories": [ { "category": "Electronics", "totalUsage": 58 }, { "category": "Tools", "totalUsage": 22 } ] }
}
```

---

#### `GET /api/dashboard/trending-assets`

**Response `200`**: `{ "data": { "assets": [ { "...": "asset object" } ] } }`

---

#### `GET /api/dashboard/recent-rentals`

**Query params**: `limit` (optional). **Response `200`**: `{ "data": { "rentals": [ { "...": "rental object" } ] } }`

---

#### `GET /api/dashboard/analytics`

**Response `200`**
```json
{
  "data": {
    "analytics": {
      "totalRentals": 19,
      "statusBreakdown": { "COMPLETED": 12, "ACCEPTED": 2, "CANCELLED": 3, "REJECTED": 2 },
      "totalEarnings": 14200,
      "totalSpent": 5300
    }
  }
}
```

---

### 7. Wishlist — `/api/wishlist` (all 🔒)

#### `POST /api/wishlist` — Save an Asset

**Body**: `{ "assetId": "a4f1..." }`

**Response `201`**: `{ "data": { "wishlist": { "id": "...", "user_id": "...", "asset_id": "a4f1...", "created_at": "..." } } }`

Calling twice for the same asset is a no-op (returns existing entry). **Errors**: `400` trying to wishlist own asset · `404` asset not found.

---

#### `DELETE /api/wishlist/:assetId` — Remove Saved Asset

**Response `200`**: `{ "success": true, "message": "Removed from wishlist", "data": {} }`

---

#### `GET /api/wishlist` — List Wishlist

**Query params**: `page`, `limit`.

**Response `200`**: paginated list of asset objects, each with `wishlisted_at`.

---

#### `GET /api/wishlist/ids` — List Saved Asset IDs Only

Lightweight endpoint — called once after login so the frontend can render heart icons everywhere without a request per card.

**Response `200`**: `{ "data": { "assetIds": ["a4f1...", "b2e2..."] } }`

---

## API Reference — Admin Routes (`/api/admin/*`)

> All admin endpoints require `Authorization: Bearer <token>` **and** `is_admin = true`.
> Auth failure matrix: see §Auth failures section.

### Admin Conventions

**Success envelope**: `{ "success": true, "message": "...", "data": {} }`

**Failure envelope**: `{ "success": false, "message": "...", "errors": [] }`

**Pagination object** (in list responses):
```json
{ "page": 1, "limit": 10, "totalItems": 42, "totalPages": 5 }
```
- `page` default `1`, minimum `1`.
- `limit` default `10`, minimum `1`, maximum `100`.

### Admin Auth Failure Matrix

| Condition | Status | Message |
|---|---|---|
| No/malformed `Authorization` header | 401 | `Authentication token missing or malformed` |
| Expired token | 401 | `Authentication token has expired` |
| Invalid token | 401 | `Invalid authentication token` |
| Token valid, but user can't be verified | 401 | `Unable to verify admin access` |
| Migration not applied (`42703` Postgres error) | 503 | `Admin features are not set up yet — run sql/002_admin_features.sql...` |
| User is active but `is_admin = false` | 403 | `Admin access required` |
| User is deactivated (even if `is_admin = true`) | 403 | `This account has been deactivated` |
| Unexpected error checking admin status | 500 | `Failed to verify admin access` |

### `GET /api/admin/overview`

**Response `data.overview`:**
```json
{
  "totalUsers": 0,
  "activeUsers": 0,
  "newUsersToday": 0,
  "newUsersThisWeek": 0,
  "loggedInUsers": 0,
  "totalAssets": 0,
  "availableAssets": 0,
  "bookedAssets": 0,
  "completedRentals": 0,
  "activeRentals": 0,
  "pendingRequests": 0,
  "totalReviews": 0,
  "averagePlatformRating": 0,
  "totalDisputes": 0
}
```

| Field | Meaning |
|---|---|
| `activeUsers` | `is_active = true` |
| `newUsersToday` | Created since 00:00 UTC today |
| `newUsersThisWeek` | Created in the last 7 days (rolling, UTC) |
| `loggedInUsers` | `last_seen` within last 2 minutes (ONLINE users) |
| `availableAssets` / `bookedAssets` | Scoped to `is_active = true` assets |
| `pendingRequests` | Status in `REQUESTED`, `NEGOTIATING` |
| `totalDisputes` | Always `0` — reserved, no disputes table exists yet |

---

### `GET /api/admin/analytics`

Charts data computed in-memory from live tables (no aggregation table).

**Response `data.analytics`:**
```json
{
  "mostRentedCategories": [{ "category": "Electronics", "usage": 12 }],
  "topRentedAssets": [{ "id": "uuid", "title": "Drill", "usageCount": 9, "rating": 4.5 }],
  "topOwners": [{ "userId": "uuid", "name": "Jane Doe", "assetsListed": 6 }],
  "mostActiveBorrowers": [{ "userId": "uuid", "name": "John Roe", "rentalsMade": 4 }],
  "newUsersByDay": [{ "date": "2026-07-03", "count": 2 }],
  "rentalGrowthByDay": [{ "date": "2026-07-03", "count": 5 }],
  "platformUsage": { "REQUESTED": 3, "ACTIVE": 2, "COMPLETED": 10 }
}
```

- Top lists capped at **8** entries.
- `newUsersByDay` / `rentalGrowthByDay` always return exactly **14 entries** (today + 13 prior days), including zero-count days.
- `platformUsage` keys are live rental statuses — statuses with zero rentals are omitted.

---

### `GET /api/admin/activity`

**Query params**:

| Param | Notes |
|---|---|
| `page`, `limit` | see conventions |
| `type` | exact match against activity type enum |

**Response `data`:**
```json
{
  "activities": [
    {
      "id": "uuid",
      "type": "RENTAL_APPROVED",
      "message": "Jane approved a rental request for Drill",
      "user_id": "uuid",
      "meta": null,
      "created_at": "2026-07-15T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "totalItems": 42, "totalPages": 5 }
}
```

Activity logging is fire-and-forget and non-fatal — if an insert fails, it's swallowed and logged to console. If the `activity_logs` table itself is missing, the endpoint degrades to `{ activities: [], pagination: { ...totalItems: 0 } }`.

---

### `GET /api/admin/users`

**Query params**:

| Param | Type | Notes |
|---|---|---|
| `page`, `limit` | — | see conventions |
| `search` | string | Case-insensitive substring on `full_name` OR `email` |
| `isActive` | `"true"` \| `"false"` | Exact string |
| `isAdmin` | `"true"` \| `"false"` | Exact string |
| `sortBy` | string | `created_at`, `full_name`, `trust_score`, `average_rating`, `rentals_completed`, `total_assets`, `last_seen`. Invalid values silently fall back to `created_at`. |
| `sortDir` | `"asc"` \| `"desc"` | Default `desc` |

**Response `data`:**
```json
{
  "users": [
    {
      "id": "uuid", "full_name": "...", "email": "...",
      "is_verified": true, "is_active": true, "is_admin": false,
      "last_seen": "2026-07-15T09:58:00.000Z",
      "created_at": "...", "updated_at": "...",
      "presence": "ONLINE"
    }
  ],
  "pagination": {}
}
```
`password_hash` is always stripped. `presence` is computed per the Presence Calculation table above.

---

### `GET /api/admin/users/:userId`

Full user detail bundle. **404** if not found.

**Response `data`:**
```json
{
  "user": { "...": "as above, with presence" },
  "assetsListed": [],
  "rentalsGiven": [],
  "rentalsTaken": [],
  "reviewsReceived": [],
  "reviewsGiven": [],
  "recentNotifications": [],
  "stats": {
    "itemsListed": 0,
    "itemsLent": 0,
    "itemsBorrowed": 0,
    "reviewCount": 0
  }
}
```
- `assetsListed` — all assets where `owner_id = userId` (not filtered by `is_active`).
- `recentNotifications` — most recent **20** only.
- `stats.itemsLent` / `itemsBorrowed` count only `COMPLETED` rentals.

---

### `PATCH /api/admin/users/:userId/status`

**Body**: `{ "isActive": true }` — required real boolean.

**Response `data.user`**: updated user row (password_hash stripped), `updated_at` refreshed.

> ⚠️ If an admin deactivates their own account, they will lock themselves out. No self-lock-out protection exists.

---

### `GET /api/admin/assets`

**Query params**:

| Param | Type | Notes |
|---|---|---|
| `page`, `limit` | — | see conventions |
| `search` | string | Matches `title`, `category`, or `brand`, case-insensitive |
| `category` | string | Exact match |
| `availabilityStatus` | string | `AVAILABLE` \| `BOOKED` \| `UNAVAILABLE` |
| `ownerId` | UUID | Exact match |
| `sortBy` | string | `created_at`, `usage_count`, `average_rating`, `expected_price_per_day`, `title`. Falls back to `created_at` if invalid. |
| `sortDir` | `"asc"` \| `"desc"` | Default `desc` |

**Response `data`:**
```json
{
  "assets": [
    {
      "id": "uuid", "title": "...", "category": "...", "admin_hidden": false,
      "owner": { "id": "uuid", "full_name": "...", "email": "..." }
    }
  ],
  "pagination": {}
}
```
> **Not** filtered by `is_active` or `admin_hidden` — intentionally returns hidden/removed assets so admins can find and restore them. `owner` is `null` if the owning user was deleted.

---

### `PATCH /api/admin/assets/:assetId/hidden`

**Body**: `{ "hidden": true }` — required boolean.

Sets `assets.admin_hidden` — does **not** touch `is_active`. Public browse, search, and nearby endpoints filter out `admin_hidden = true` assets.

**Response `data.asset`**: full updated asset row.

---

### `DELETE /api/admin/assets/:assetId`

Soft delete — sets `assets.is_active = false`. Row is not physically deleted. There is no admin "reactivate asset" endpoint (only `admin_hidden` can be toggled back via `PATCH .../hidden`).

**Response `data.asset`**: the updated (now-inactive) asset row.

---

### `GET /api/admin/rentals`

**Query params**:

| Param | Notes |
|---|---|
| `page`, `limit` | see conventions |
| `status` | Exact match against rental status, applied at DB level |
| `search` | Matches asset title, owner name, or borrower name |

> ⚠️ **`search` caveat**: Applied **in JavaScript, after** the page is fetched from DB. It only filters within the current page of results — it does **not** search the entire `rentals` table. `pagination.totalItems` reflects the unfiltered count. Treat this as a same-page refinement only.

**Response `data`:**
```json
{
  "rentals": [
    {
      "id": "uuid", "status": "ACTIVE",
      "owner": { "id": "uuid", "full_name": "...", "email": "..." },
      "borrower": { "id": "uuid", "full_name": "...", "email": "..." },
      "asset": { "id": "uuid", "title": "...", "category": "..." }
    }
  ],
  "pagination": {}
}
```

---

### `GET /api/admin/reviews`

**Query params**:

| Param | Notes |
|---|---|
| `page`, `limit` | see conventions |
| `minRating` | float 1–5, optional |
| `maxRating` | float 1–5, optional |

**Response `data`:**
```json
{
  "reviews": [
    {
      "id": "uuid", "rating": 5, "comment": "...",
      "reviewer": { "id": "uuid", "full_name": "...", "email": "..." },
      "receiver": { "id": "uuid", "full_name": "...", "email": "..." }
    }
  ],
  "pagination": {}
}
```

---

### `DELETE /api/admin/reviews/:reviewId`

**404** if not found. Hard-deletes the review row, then **recalculates and persists** the receiver's `average_rating`.

**Response `data`**: `{}` (empty object).

---

## Suggested Test Flow

1. Register two users (Owner, Borrower) → save both tokens.
2. Owner creates an asset.
3. Borrower creates a rental request for that asset.
4. Owner counter-offers (optional) → Borrower/Owner accepts.
5. Owner confirms pickup (`PATCH /:id/start`).
6. Owner (or Borrower) completes the rental.
7. Either side leaves a review for the other.
8. Check `/api/dashboard/overview` for both users.
9. (Admin) Run migration, promote admin, test `/api/admin/overview`.

---

## Environment Variable Reference

| Variable | Required | Notes |
|---|---|---|
| `PORT` | — | Default `3001` |
| `NODE_ENV` | — | `development` or `production` |
| `SUPABASE_URL` | ✅ | Supabase project URL (Settings → API → Project URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key — never expose in frontend code |
| `JWT_SECRET` | ✅ | Long random string. Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"` |
| `JWT_EXPIRES_IN` | — | Default `7d` |
| `CLIENT_URL` | — | Frontend URL for CORS (e.g. `http://localhost:5000`). Use `*` for local dev. |

---

## Deployment

| Service | Platform |
|---|---|
| Backend | Render |
| Database | Supabase (PostgreSQL) |

No new environment variables are needed for admin features — they reuse the same Supabase service-role connection and JWT secret.

> **Security reminder for production**: Set `CLIENT_URL` to your exact production frontend URL — not `*`. Rotate `JWT_SECRET` and Supabase service role key if ever exposed. Never commit real `.env` files.
