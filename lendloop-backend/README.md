# LendLoop Backend

Community Asset Sharing & Rental Platform — REST API built with Node.js, Express.js, and Supabase PostgreSQL.

## Tech Stack

- Node.js + Express.js
- Supabase PostgreSQL (via `@supabase/supabase-js`, no ORM)
- JWT authentication
- bcrypt password hashing
- express-validator
- MVC architecture: Routes → Controllers → Services → Supabase

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js            # environment variable loader/validator
│   │   └── supabase.js       # Supabase client (service role)
│   ├── controllers/          # HTTP request/response handlers
│   ├── services/             # business logic + Supabase queries
│   ├── routes/                # route definitions
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── validation.middleware.js # express-validator result handler
│   │   └── error.middleware.js      # centralized error handling + AppError
│   ├── validators/           # express-validator rule sets per module
│   ├── utils/
│   │   ├── response.js       # success()/failure() JSON helpers
│   │   ├── constants.js      # enum constants (statuses, types)
│   │   └── helpers.js        # JWT, pagination, haversine, sanitizers
│   ├── app.js                 # Express app + middleware pipeline
│   └── server.js              # server bootstrap
├── package.json
└── .env.example
```

## Setup

```bash
cd backend
npm install
cp .env.example .env
# fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm run dev   # nodemon
# or
npm start
```

The server starts on `PORT` (default `5000`). Health check: `GET /health`.

## Database

Uses the **final** Supabase PostgreSQL schema exactly as specified — `users`, `assets`, `rentals`, `reviews`, `notifications`. No table/column was renamed. All API request bodies use camelCase; the service layer maps every field to its snake_case column before hitting Supabase.

## Response Format

**Success**
```json
{ "success": true, "message": "...", "data": {} }
```

**Failure**
```json
{ "success": false, "message": "...", "errors": [] }
```

## API Reference

All routes are prefixed with `/api`. 🔒 = requires `Authorization: Bearer <token>`.

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Login, returns JWT |
| GET | `/profile` 🔒 | Get current user's profile |

### Assets (`/api/assets`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` 🔒 | Create asset |
| GET | `/` | List assets (pagination, filters: `category`, `city`, `minPrice`, `maxPrice`, `availabilityStatus`) |
| GET | `/nearby` | Nearby assets by `latitude`, `longitude`, `radiusKm` (haversine) |
| GET | `/search` | Search assets by `q` |
| GET | `/:id` | Get asset by id |
| PUT | `/:id` 🔒 | Update asset (owner only) |
| DELETE | `/:id` 🔒 | Soft-delete asset (owner only) |

### Rentals (`/api/rentals`) — all 🔒
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create rental request |
| GET | `/history` | Rental history (filters: `role`, `status`, pagination) |
| PATCH | `/:id/counter-offer` | Owner submits a counter offer |
| PATCH | `/:id/accept` | Accept current offer |
| PATCH | `/:id/reject` | Reject rental |
| PATCH | `/:id/cancel` | Cancel rental (before it's active) |
| PATCH | `/:id/complete` | Mark rental completed |

Rental status flow: `REQUESTED → NEGOTIATING → ACCEPTED → ACTIVE → COMPLETED` (or `REJECTED` / `CANCELLED`).

### Reviews (`/api/reviews`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` 🔒 | Create review (only for `COMPLETED` rentals) |
| GET | `/user/:userId` | Get a user's reviews + average rating |

### Notifications (`/api/notifications`) — all 🔒
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create notification |
| GET | `/` | List current user's notifications (filter `isRead`, pagination) |
| PATCH | `/:id/read` | Mark notification as read |

### Dashboard (`/api/dashboard`) — all 🔒
| Method | Endpoint | Description |
|---|---|---|
| GET | `/overview` | Asset/rental/trust stats for current user |
| GET | `/trending-categories` | Categories ranked by total usage |
| GET | `/trending-assets` | Top assets by usage/rating |
| GET | `/recent-rentals` | Current user's most recent rentals |
| GET | `/analytics` | Status breakdown, total earnings/spent |

## Business Rules Enforced

- Email uniqueness enforced at registration.
- Passwords stored only as bcrypt hashes, never returned in responses.
- Only asset owners can update/delete their assets.
- Users cannot rent their own assets.
- Rentals start in `REQUESTED`; negotiation only allowed if `price_negotiable` is true.
- Reviews only allowed after a rental reaches `COMPLETED`, one review per reviewer per rental.
- `average_rating` recalculated whenever a review is added.
- `usage_count` increments on rental completion; `total_assets` updates on asset create/delete.
- Nearby search computed via the haversine formula over stored `latitude`/`longitude`.
- All timestamps stored/read in UTC via Supabase `timestamp` columns.

# LendLoop Backend — Setup & API Documentation

Complete reference for running the backend locally and testing every endpoint end-to-end.

---

## 1. Setup & Run

### Prerequisites
- Node.js 18+
- A Supabase project with the LendLoop schema (`users`, `assets`, `rentals`, `reviews`, `notifications`) already created

### Steps

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
```

> Use the **service role key** (not the anon key) — the backend talks to Supabase directly with full access and enforces authorization itself via JWT.

Run it:

```bash
npm run dev     # nodemon, auto-restart
npm start       # plain node
```

Server boots on `http://localhost:5000` (or your `PORT`).

### Health Check
```
GET /health
```
```json
{ "success": true, "message": "LendLoop API is healthy", "data": { "uptime": 12.34 } }
```

### Authenticated Requests
Every 🔒 route requires a header:
```
Authorization: Bearer <token>
```
The token is returned by `/api/auth/register` and `/api/auth/login`.

### Global Response Shapes

**Success**
```json
{ "success": true, "message": "Human readable message", "data": { } }
```

**Failure**
```json
{ "success": false, "message": "Human readable message", "errors": [] }
```
Validation failures populate `errors` as `[{ "field": "email", "message": "Email must be valid" }]`.

### Common Status Codes
| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / invalid business rule |
| 401 | Missing/invalid/expired token, wrong credentials |
| 403 | Authenticated but not authorized for this resource |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, duplicate review) |
| 422 | Validation failed |
| 500 | Server/database error |

### Enums Used Across the API
```
availabilityStatus  → AVAILABLE | BOOKED | UNAVAILABLE
rental status       → REQUESTED | NEGOTIATING | ACCEPTED | ACTIVE | COMPLETED | REJECTED | CANCELLED
notification type   → REQUEST | COUNTER_OFFER | ACCEPTED | REJECTED | ACTIVE | COMPLETED | GENERAL
```

### Suggested Test Flow
1. Register two users (Owner, Borrower) → save both tokens.
2. Owner creates an asset.
3. Borrower creates a rental request for that asset.
4. Owner counter-offers (optional) → Borrower/Owner accepts.
5. Owner (or Borrower) completes the rental.
6. Either side leaves a review for the other.
7. Check `/api/dashboard/overview` for both users.

---

## 2. Authentication — `/api/auth`

### Register
`POST /api/auth/register`

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

---

### Login
`POST /api/auth/login`

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

---

### Get Profile 🔒
`GET /api/auth/profile`

**Response `200`**
```json
{ "success": true, "message": "Profile fetched successfully", "data": { "user": { "...": "sanitized user" } } }
```

---

## 3. Assets — `/api/assets`

### Create Asset 🔒
`POST /api/assets`

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

**Response `201`**
```json
{
  "success": true,
  "message": "Asset created successfully",
  "data": {
    "asset": {
      "id": "a4f1...",
      "owner_id": "b1e7c2a0-...",
      "title": "Canon EOS R6 Camera",
      "category": "Electronics",
      "description": "Full-frame mirrorless camera, barely used",
      "brand": "Canon",
      "condition": "Like New",
      "purchase_year": 2023,
      "expected_price_per_day": 1200,
      "minimum_price": 900,
      "price_negotiable": true,
      "security_deposit": 5000,
      "availability_status": "AVAILABLE",
      "available_from": "2026-07-15",
      "available_to": "2026-12-31",
      "latitude": 17.385,
      "longitude": 78.4867,
      "address": "Jubilee Hills",
      "city": "Hyderabad",
      "state": "Telangana",
      "country": "India",
      "image_url": "https://.../camera.jpg",
      "usage_count": 0,
      "average_rating": 0,
      "is_active": true,
      "created_at": "2026-07-11T10:05:00.000Z",
      "updated_at": "2026-07-11T10:05:00.000Z"
    }
  }
}
```

---

### List Assets
`GET /api/assets?page=1&limit=10&category=Electronics&city=Hyderabad&minPrice=500&maxPrice=2000&availabilityStatus=AVAILABLE`

All query params optional.

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

---

### Nearby Assets
`GET /api/assets/nearby?latitude=17.385&longitude=78.4867&radiusKm=15&page=1&limit=10`

`latitude`/`longitude` required, `radiusKm` optional (default `25`).

**Response `200`**
```json
{
  "success": true,
  "message": "Nearby assets fetched successfully",
  "data": {
    "assets": [ { "...": "asset object", "distance_km": 3.42 } ],
    "pagination": { "page": 1, "limit": 10, "totalItems": 6, "totalPages": 1 }
  }
}
```

---

### Search Assets
`GET /api/assets/search?q=camera&page=1&limit=10`

Matches `title`, `description`, `category`, `brand` (case-insensitive).

**Response `200`**: same shape as List Assets.

---

### Get Asset By Id
`GET /api/assets/:id`

**Response `200`**
```json
{ "success": true, "message": "Asset fetched successfully", "data": { "asset": { "...": "asset object" } } }
```
**Errors**: `404` asset not found

---

### Update Asset 🔒 (owner only)
`PUT /api/assets/:id`

**Body** (send only fields you want to change)
```json
{
  "expectedPricePerDay": 1000,
  "availabilityStatus": "UNAVAILABLE",
  "description": "Updated description"
}
```

**Response `200`**: updated asset object.
**Errors**: `403` not the owner · `404` not found

---

### Delete Asset 🔒 (owner only, soft delete)
`DELETE /api/assets/:id`

**Response `200`**
```json
{ "success": true, "message": "Asset deleted successfully", "data": {} }
```

---

## 4. Rentals — `/api/rentals` (all 🔒)

### Create Rental Request
`POST /api/rentals`

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

---

### Counter Offer (owner only)
`PATCH /api/rentals/:id/counter-offer`

**Body**
```json
{ "counterOfferPrice": 3400, "ownerMessage": "Best I can do is 3400 for the weekend." }
```

**Response `200`**: rental object with `status: "NEGOTIATING"`, `counter_offer_price` set.
**Errors**: `400` asset not negotiable / wrong status · `403` not the owner

---

### Accept Offer (owner or borrower)
`PATCH /api/rentals/:id/accept`

**Body** (optional — defaults to the current counter offer or offered price)
```json
{ "agreedPrice": 3400 }
```

**Response `200`**: rental object with `status: "ACCEPTED"`, `agreed_price` set. Asset's `availability_status` becomes `BOOKED`.

---

### Reject Offer
`PATCH /api/rentals/:id/reject`

No body required.

**Response `200`**: rental object with `status: "REJECTED"`.

---

### Cancel Rental
`PATCH /api/rentals/:id/cancel`

No body required. Not allowed once status is `ACTIVE`, `COMPLETED`, `REJECTED`, or already `CANCELLED`.

**Response `200`**: rental object with `status: "CANCELLED"`.

---

### Complete Rental
`PATCH /api/rentals/:id/complete`

No body required. Valid from `ACCEPTED` or `ACTIVE`.

**Response `200`**: rental object with `status: "COMPLETED"`. Side effects: asset becomes `AVAILABLE` again, `usage_count` +1, owner's `rentals_completed` +1, borrower's `rentals_taken` +1.

---

### Rental History
`GET /api/rentals/history?role=owner&status=COMPLETED&page=1&limit=10`

All query params optional. `role` = `owner` | `borrower` (omit for both).

**Response `200`**
```json
{
  "success": true,
  "message": "Rental history fetched successfully",
  "data": {
    "rentals": [ { "...": "rental object" } ],
    "pagination": { "page": 1, "limit": 10, "totalItems": 12, "totalPages": 2 }
  }
}
```

---

## 5. Reviews — `/api/reviews`

### Create Review 🔒
`POST /api/reviews`

Only allowed once the related rental is `COMPLETED`, and only by a participant of that rental, reviewing the other participant.

**Body**
```json
{
  "rentalId": "r7c9...",
  "receiverId": "b1e7c2a0-...",
  "rating": 4.5,
  "review": "Asset was in great condition, smooth handover."
}
```

**Response `201`**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "review": {
      "id": "rv12...",
      "rental_id": "r7c9...",
      "reviewer_id": "c9d2e3f4-...",
      "receiver_id": "b1e7c2a0-...",
      "rating": 4.5,
      "review": "Asset was in great condition, smooth handover.",
      "created_at": "2026-07-24T09:00:00.000Z"
    }
  }
}
```
**Errors**: `400` rental not completed / receiver not a participant / reviewing yourself · `403` not a participant · `409` already reviewed this rental

---

### Get Reviews For a User
`GET /api/reviews/user/:userId?page=1&limit=10`

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

## 6. Notifications — `/api/notifications` (all 🔒)

### Create Notification
`POST /api/notifications`

**Body**
```json
{
  "userId": "b1e7c2a0-...",
  "title": "New message",
  "message": "You have a new message from the borrower.",
  "type": "GENERAL"
}
```
`type` optional (defaults to `GENERAL`); must be one of the enum values if provided.

**Response `201`**
```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "notification": {
      "id": "n1a2...",
      "user_id": "b1e7c2a0-...",
      "title": "New message",
      "message": "You have a new message from the borrower.",
      "type": "GENERAL",
      "is_read": false,
      "created_at": "2026-07-11T10:20:00.000Z"
    }
  }
}
```

---

### Get Notifications
`GET /api/notifications?isRead=false&page=1&limit=10`

**Response `200`**
```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": {
    "notifications": [ { "...": "notification object" } ],
    "pagination": { "page": 1, "limit": 10, "totalItems": 5, "totalPages": 1 }
  }
}
```

---

### Mark as Read
`PATCH /api/notifications/:id/read`

No body required.

**Response `200`**: notification object with `is_read: true`.
**Errors**: `403` not the owner of the notification · `404` not found

---

## 7. Dashboard — `/api/dashboard` (all 🔒)

### Overview
`GET /api/dashboard/overview`

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

### Trending Categories
`GET /api/dashboard/trending-categories`

**Response `200`**
```json
{
  "success": true,
  "message": "Trending categories fetched successfully",
  "data": { "categories": [ { "category": "Electronics", "totalUsage": 58 }, { "category": "Tools", "totalUsage": 22 } ] }
}
```

### Trending Assets
`GET /api/dashboard/trending-assets`

**Response `200`**
```json
{ "success": true, "message": "Trending assets fetched successfully", "data": { "assets": [ { "...": "asset object" } ] } }
```

### Recent Rentals
`GET /api/dashboard/recent-rentals?limit=5`

**Response `200`**
```json
{ "success": true, "message": "Recent rentals fetched successfully", "data": { "rentals": [ { "...": "rental object" } ] } }
```

### Analytics
`GET /api/dashboard/analytics`

**Response `200`**
```json
{
  "success": true,
  "message": "Analytics fetched successfully",
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

## 8. Full Endpoint Index

| Module | Method | Endpoint | Auth |
|---|---|---|---|
| Health | GET | `/health` | — |
| Auth | POST | `/api/auth/register` | — |
| Auth | POST | `/api/auth/login` | — |
| Auth | GET | `/api/auth/profile` | 🔒 |
| Assets | POST | `/api/assets` | 🔒 |
| Assets | GET | `/api/assets` | — |
| Assets | GET | `/api/assets/nearby` | — |
| Assets | GET | `/api/assets/search` | — |
| Assets | GET | `/api/assets/:id` | — |
| Assets | PUT | `/api/assets/:id` | 🔒 owner |
| Assets | DELETE | `/api/assets/:id` | 🔒 owner |
| Rentals | POST | `/api/rentals` | 🔒 |
| Rentals | GET | `/api/rentals/history` | 🔒 |
| Rentals | PATCH | `/api/rentals/:id/counter-offer` | 🔒 owner |
| Rentals | PATCH | `/api/rentals/:id/accept` | 🔒 participant |
| Rentals | PATCH | `/api/rentals/:id/reject` | 🔒 participant |
| Rentals | PATCH | `/api/rentals/:id/cancel` | 🔒 participant |
| Rentals | PATCH | `/api/rentals/:id/complete` | 🔒 participant |
| Reviews | POST | `/api/reviews` | 🔒 |
| Reviews | GET | `/api/reviews/user/:userId` | — |
| Notifications | POST | `/api/notifications` | 🔒 |
| Notifications | GET | `/api/notifications` | 🔒 |
| Notifications | PATCH | `/api/notifications/:id/read` | 🔒 owner |
| Dashboard | GET | `/api/dashboard/overview` | 🔒 |
| Dashboard | GET | `/api/dashboard/trending-categories` | 🔒 |
| Dashboard | GET | `/api/dashboard/trending-assets` | 🔒 |
| Dashboard | GET | `/api/dashboard/recent-rentals` | 🔒 |
| Dashboard | GET | `/api/dashboard/analytics` | 🔒 |
