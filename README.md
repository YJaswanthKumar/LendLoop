# LendLoop
### Community Asset Sharing & Rental Platform

LendLoop is a full-stack web application that enables individuals to list, discover, rent, and manage community-owned assets through a secure and user-friendly platform. Instead of purchasing items that are only used occasionally, users can share resources within their community, making rentals more affordable and reducing unnecessary ownership.

The platform provides secure user authentication, asset management, rental request negotiation, reviews, notifications, search, nearby asset discovery, and a personalized dashboard, all integrated through a RESTful API with a PostgreSQL database.

| Category       | Details                                   |
| -------------- | ----------------------------------------- |
| Project Type   | Full Stack Web Application                |
| Domain         | Community Asset Sharing & Rental Platform |
| Frontend       | React + Vite                              |
| Backend        | Node.js + Express                         |
| Database       | Supabase PostgreSQL                       |
| Authentication | JWT + bcrypt                              |
| Deployment     | Vercel + Render                           |
| APIs           | RESTful APIs                              |
| Architecture   | MVC + Service Layer                       |

# Project Links

| Resource | Link |
|----------|------|
| GitHub Repository | :contentReference[oaicite:0]{index=0} |
| Frontend Deployment | https://lend-loop-kohl.vercel.app |
| Backend API | https://lendloop-oizd.onrender.com |

# Demo Credentials

To simplify project evaluation, the following test accounts are available. These accounts already contain sample data (assets, rental history, notifications, etc.) stored in the Supabase database.

| User | Email | Password |
|------|-------|----------|
| Test User 1 | test123@gmail.com | Test@123 |
| Test User 2 | test1@gmail.com | Test@123 |
| Test User 3 | test2@gmail.com | Test@123 |
| Test User 4 | check1@gmail.com | check@123 |

> **Note:** These are demonstration accounts created specifically for evaluation purposes. Sample data has been pre-populated in the database to allow judges to explore the application's functionality without creating new accounts.

---

# Problem Statement

Many useful assets such as cameras, laptops, tools, sports equipment, and musical instruments remain unused for long periods despite being expensive to purchase. At the same time, many people require these items only for a short duration but have no reliable platform to rent them from nearby individuals.

LendLoop addresses this problem by providing a centralized platform where community members can list their assets for rent, negotiate rental terms, complete rentals securely, and build trust through reviews and ratings.

---

# Project Objectives

- Provide a secure community-based rental platform.
- Allow users to list and manage rentable assets.
- Enable nearby asset discovery.
- Support rental negotiation between owners and borrowers.
- Maintain trust through ratings and reviews.
- Track rental history and analytics.
- Provide notifications throughout the rental lifecycle.

---

# Key Features

### User Authentication
- User Registration
- User Login
- JWT Authentication
- Password Hashing using bcrypt
- Protected Routes

### Asset Management
- Create Asset
- Edit Asset
- Delete Asset
- Browse Assets
- Search Assets
- Nearby Asset Search

### Rental Management
- Create Rental Request
- Counter Offer
- Accept Rental
- Reject Rental
- Cancel Rental
- Complete Rental
- Rental History

### Reviews
- Submit Review
- Average Rating Calculation
- User Review History

### Notifications
- Create Notifications
- View Notifications
- Mark Notifications as Read

### Dashboard
- Dashboard Overview
- Recent Rentals
- Trending Assets
- Trending Categories
- Analytics

---

# Technology Stack

## Frontend

- React.js
- Vite
- JavaScript
- REST API Integration

## Backend

- Node.js
- Express.js
- MVC Architecture
- JWT Authentication
- bcrypt
- express-validator

## Database

- Supabase PostgreSQL
- Relational Database Design

## Deployment

- Frontend : Vercel
- Backend : Render
- Database : Supabase

---

# High-Level System Architecture

```
                   +----------------------+
                   |      Frontend        |
                   |   React + Vite       |
                   +----------+-----------+
                              |
                     REST API Requests
                              |
                              ▼
                   +----------------------+
                   |   Express Backend     |
                   | Controllers           |
                   | Services              |
                   | Middleware            |
                   +----------+-----------+
                              |
                     Supabase Client
                              |
                              ▼
                +-----------------------------+
                | Supabase PostgreSQL Database |
                +-----------------------------+
                     |      |       |      |
                     ▼      ▼       ▼      ▼
                  Users  Assets  Rentals Reviews
                               |
                               ▼
                        Notifications
```

---

# System Workflow

```
User
   │
   ▼
Frontend (React + Vite)
   │
   ▼
REST API Request
   │
   ▼
Express Router
   │
   ▼
Controller
   │
   ▼
Service Layer
   │
   ▼
Supabase Client
   │
   ▼
PostgreSQL Database
   │
   ▼
Service Layer
   │
   ▼
Controller
   │
   ▼
JSON Response
   │
   ▼
Frontend UI
```

---

# Project Structure

## Frontend

```
frontend/
│
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── styles/
│   ├── utils/
│   └── main.jsx
│
├── package.json
└── vite.config.js
```

### Frontend Folder Description

| Folder | Purpose |
|----------|---------|
| assets | Static assets |
| components | Reusable UI components |
| contexts | Global application state |
| hooks | Custom React hooks |
| pages | Individual application pages |
| routes | Routing configuration |
| services | API communication |
| styles | Styling |
| utils | Helper functions |

---

## Backend

```
backend/
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
├── package.json
└── .env.example
```

### Backend Folder Description

| Folder | Purpose |
|----------|---------|
| config | Environment configuration and Supabase client |
| controllers | Request and response handling |
| services | Business logic and database interaction |
| routes | API endpoint definitions |
| middleware | Authentication, validation, and error handling |
| validators | Input validation |
| utils | Helper functions and common utilities |

---

# Integration Overview

The frontend communicates with the backend through REST APIs.

The backend processes requests using an MVC architecture and interacts directly with the Supabase PostgreSQL database using the official Supabase JavaScript client.

Authentication is handled using JWT tokens, while passwords are securely stored using bcrypt hashing. The backend validates requests, applies business rules, interacts with the database, and returns standardized JSON responses to the frontend.

# Database Design

LendLoop uses **Supabase PostgreSQL**, a relational database, to store and manage application data. The database is designed to maintain data consistency, reduce redundancy, and establish clear relationships between entities involved in the rental workflow.

The database follows a relational model where users own assets, assets receive rental requests, completed rentals generate reviews, and important system events are delivered through notifications.

---

# Database Architecture

```
                           +----------------+
                           |     Users      |
                           +----------------+
                                  |
              +-------------------+------------------+
              |                                      |
              | owns                                 | receives
              ▼                                      ▼
        +--------------+                    +----------------+
        |    Assets    |                    | Notifications  |
        +--------------+                    +----------------+
              |
              | rented through
              ▼
        +--------------+
        |   Rentals    |
        +--------------+
         ▲            ▲
         |            |
 borrower |            | owner
         |            |
         +------------+
              |
              | completed rental
              ▼
        +--------------+
        |   Reviews    |
        +--------------+
```

---

# Entity Relationships

| Parent Table | Child Table | Relationship |
|---------------|-------------|--------------|
| Users | Assets | One User → Many Assets |
| Users | Rentals | One User → Many Rentals (Owner/Borrower) |
| Assets | Rentals | One Asset → Many Rental Requests |
| Rentals | Reviews | One Rental → Multiple Reviews |
| Users | Reviews | One User → Many Reviews |
| Users | Notifications | One User → Many Notifications |

---

# Database Tables

## 1. Users

Stores all registered users and their profile information.

### Primary Key

```
id
```

### Important Columns

| Column | Description |
|---------|-------------|
| id | Unique user ID |
| full_name | User full name |
| email | Login email |
| password_hash | Encrypted password |
| phone | Contact number |
| profile_image | Profile picture |
| city | City |
| state | State |
| country | Country |
| latitude | User latitude |
| longitude | User longitude |
| trust_score | Trust score |
| average_rating | Average review rating |
| rentals_completed | Number of completed rentals as owner |
| rentals_taken | Number of rentals taken |
| total_assets | Number of listed assets |
| is_verified | Verification status |
| is_active | Account status |
| created_at | Record creation time |
| updated_at | Last update |

---

## 2. Assets

Stores all assets listed by users.

### Primary Key

```
id
```

### Foreign Key

```
owner_id → users.id
```

### Important Columns

| Column | Description |
|---------|-------------|
| id | Asset ID |
| owner_id | Owner reference |
| title | Asset title |
| category | Asset category |
| description | Description |
| brand | Brand |
| condition | Condition |
| purchase_year | Purchase year |
| expected_price_per_day | Expected daily rent |
| minimum_price | Minimum acceptable rent |
| price_negotiable | Negotiation enabled |
| security_deposit | Deposit amount |
| availability_status | AVAILABLE / BOOKED / UNAVAILABLE |
| available_from | Availability start |
| available_to | Availability end |
| latitude | Asset latitude |
| longitude | Asset longitude |
| address | Address |
| city | City |
| state | State |
| country | Country |
| image_url | Asset image |
| usage_count | Number of rentals |
| average_rating | Asset rating |
| is_active | Soft delete flag |
| created_at | Created time |
| updated_at | Updated time |

---

## 3. Rentals

Stores every rental transaction.

### Primary Key

```
id
```

### Foreign Keys

```
asset_id → assets.id

owner_id → users.id

borrower_id → users.id
```

### Important Columns

| Column | Description |
|---------|-------------|
| id | Rental ID |
| asset_id | Asset reference |
| owner_id | Owner |
| borrower_id | Borrower |
| request_date | Request time |
| start_date | Rental start |
| end_date | Rental end |
| total_days | Rental duration |
| expected_price | Original price |
| offered_price | Borrower offer |
| counter_offer_price | Counter offer |
| agreed_price | Final agreed price |
| security_deposit | Deposit |
| owner_message | Owner message |
| borrower_message | Borrower message |
| status | Rental status |
| created_at | Created time |
| updated_at | Updated time |

---

### Rental Status Flow

```
REQUESTED
      │
      ▼
NEGOTIATING
      │
      ▼
ACCEPTED
      │
      ▼
ACTIVE
      │
      ▼
COMPLETED
```

Alternative outcomes

```
REQUESTED
      │
      ├────────► REJECTED
      │
      └────────► CANCELLED
```

---

## 4. Reviews

Stores ratings and feedback after completed rentals.

### Primary Key

```
id
```

### Foreign Keys

```
rental_id → rentals.id

reviewer_id → users.id

receiver_id → users.id
```

### Important Columns

| Column | Description |
|---------|-------------|
| id | Review ID |
| rental_id | Rental |
| reviewer_id | Reviewer |
| receiver_id | Review receiver |
| rating | Rating |
| review | Feedback |
| created_at | Created time |

---

## 5. Notifications

Stores notifications sent to users.

### Primary Key

```
id
```

### Foreign Key

```
user_id → users.id
```

### Important Columns

| Column | Description |
|---------|-------------|
| id | Notification ID |
| user_id | User |
| title | Notification title |
| message | Notification message |
| type | Notification type |
| is_read | Read status |
| created_at | Created time |

---

# Database Constraints

The backend enforces several business rules to maintain data integrity.

- Email addresses must be unique.
- Passwords are stored only as bcrypt hashes.
- Only authenticated users can access protected APIs.
- Users cannot rent their own assets.
- Asset owners can edit or delete only their own assets.
- Reviews can only be submitted after a rental is completed.
- A user can review only once for a completed rental.
- Soft deletion is used for assets through the `is_active` field.
- Rental status transitions follow the predefined workflow.

---

# Data Integrity

The application maintains data consistency using the following mechanisms:

- Primary and foreign key relationships.
- JWT authentication for protected resources.
- Password hashing using bcrypt.
- Input validation before database operations.
- Ownership verification before update and delete operations.
- Standardized API responses.
- Business rule validation inside the service layer.

---

# Authentication Flow

```
User
   │
   ▼
Register
   │
   ▼
Password Hash (bcrypt)
   │
   ▼
Users Table
   │
   ▼
Login
   │
   ▼
Password Verification
   │
   ▼
JWT Token Generated
   │
   ▼
Protected APIs
```

---

# Rental Workflow

```
Owner
   │
   ▼
Create Asset
   │
   ▼
Asset Available
   │
Borrower
   │
   ▼
Rental Request
   │
   ▼
Owner Reviews Request
   │
   ├─────────────► Reject
   │
   ├─────────────► Counter Offer
   │                    │
   │                    ▼
   │             Borrower Accepts
   │
   ▼
Accept Rental
   │
   ▼
Rental Completed
   │
   ▼
Review Submission
   │
   ▼
Dashboard Statistics Updated
```

# REST API Documentation

The backend exposes a RESTful API for managing authentication, assets, rentals, reviews, notifications, and dashboard analytics.

**Base URL (Local)**

```
http://localhost:5000
```

**Base URL (Production)**

```
https://lendloop-oizd.onrender.com
```

---

# Authentication

Protected endpoints require a JWT token.

```
Authorization: Bearer <JWT_TOKEN>
```

---

# Standard API Response

## Success

```json
{
    "success": true,
    "message": "Operation Successful",
    "data": {}
}
```

---

## Error

```json
{
    "success": false,
    "message": "Error Message",
    "errors": []
}
```

---

# API Modules

- Authentication
- Assets
- Rentals
- Reviews
- Notifications
- Dashboard

---

# 1. Authentication APIs

Base Route

```
/api/auth
```

| Method | Endpoint | Authentication | Purpose |
|----------|------------|----------------|----------|
| POST | /register | No | Register a new user |
| POST | /login | No | Login user |
| GET | /profile | Yes | Get logged in user profile |

---

## POST /api/auth/register

Registers a new user.

### Request Body

| Field | Required |
|---------|----------|
| fullName | Yes |
| email | Yes |
| password | Yes |
| phone | No |
| city | No |
| state | No |
| country | No |
| latitude | No |
| longitude | No |

---

## POST /api/auth/login

Authenticates an existing user.

### Request Body

| Field | Required |
|---------|----------|
| email | Yes |
| password | Yes |

Returns

- User Information
- JWT Token

---

## GET /api/auth/profile

Returns authenticated user's profile.

Authentication Required

---

# 2. Asset APIs

Base Route

```
/api/assets
```

| Method | Endpoint | Authentication | Purpose |
|----------|------------|----------------|----------|
| POST | / | Yes | Create Asset |
| GET | / | No | Get All Assets |
| GET | /search | No | Search Assets |
| GET | /nearby | No | Nearby Assets |
| GET | /:id | No | Asset Details |
| PUT | /:id | Yes | Update Asset |
| DELETE | /:id | Yes | Delete Asset |

---

## POST /api/assets

Creates a new asset.

### Main Fields

- title
- category
- description
- brand
- condition
- purchaseYear
- expectedPricePerDay
- minimumPrice
- priceNegotiable
- securityDeposit
- availableFrom
- availableTo
- latitude
- longitude
- address
- city
- state
- country
- imageUrl

---

## GET /api/assets

Returns paginated asset list.

Supports filters

- page
- limit
- category
- city
- minPrice
- maxPrice
- availabilityStatus

---

## GET /api/assets/search

Search assets by

- Title
- Description
- Brand
- Category

Query

```
?q=
```

---

## GET /api/assets/nearby

Returns nearby assets.

Query Parameters

```
latitude

longitude

radiusKm

page

limit
```

---

## GET /api/assets/:id

Returns complete details of a specific asset.

---

## PUT /api/assets/:id

Updates asset information.

Only owner can update.

---

## DELETE /api/assets/:id

Soft deletes asset.

Only owner can delete.

---

# 3. Rental APIs

Base Route

```
/api/rentals
```

| Method | Endpoint | Authentication | Purpose |
|----------|------------|----------------|----------|
| POST | / | Yes | Create Rental Request |
| GET | /history | Yes | Rental History |
| PATCH | /:id/counter-offer | Yes | Counter Offer |
| PATCH | /:id/accept | Yes | Accept Request |
| PATCH | /:id/reject | Yes | Reject Request |
| PATCH | /:id/cancel | Yes | Cancel Rental |
| PATCH | /:id/complete | Yes | Complete Rental |

---

## POST /api/rentals

Creates rental request.

### Main Fields

- assetId
- startDate
- endDate
- offeredPrice
- borrowerMessage

---

## GET /api/rentals/history

Returns rental history.

Supports

```
role

status

page

limit
```

---

## PATCH /api/rentals/:id/counter-offer

Owner sends counter offer.

Main Fields

- counterOfferPrice
- ownerMessage

---

## PATCH /api/rentals/:id/accept

Accept rental request.

Can optionally send

```
agreedPrice
```

---

## PATCH /api/rentals/:id/reject

Reject rental request.

---

## PATCH /api/rentals/:id/cancel

Cancel rental.

---

## PATCH /api/rentals/:id/complete

Marks rental as completed.

Updates

- Rental Status
- Asset Availability
- Usage Count
- User Statistics

---

# Rental Status Lifecycle

```
REQUESTED
      │
      ▼
NEGOTIATING
      │
      ▼
ACCEPTED
      │
      ▼
ACTIVE
      │
      ▼
COMPLETED
```

Alternative States

```
REQUESTED

↓

REJECTED


REQUESTED

↓

CANCELLED
```

---

# 4. Review APIs

Base Route

```
/api/reviews
```

| Method | Endpoint | Authentication | Purpose |
|----------|------------|----------------|----------|
| POST | / | Yes | Submit Review |
| GET | /user/:userId | No | User Reviews |

---

## POST /api/reviews

Creates review after completed rental.

Fields

- rentalId
- receiverId
- rating
- review

---

## GET /api/reviews/user/:userId

Returns

- Reviews
- Average Rating
- Pagination

---

# 5. Notification APIs

Base Route

```
/api/notifications
```

| Method | Endpoint | Authentication | Purpose |
|----------|------------|----------------|----------|
| POST | / | Yes | Create Notification |
| GET | / | Yes | Get Notifications |
| PATCH | /:id/read | Yes | Mark Notification Read |

---

## POST /api/notifications

Creates notification.

Fields

- userId
- title
- message
- type

---

## GET /api/notifications

Returns paginated notifications.

Supports

```
isRead

page

limit
```

---

## PATCH /api/notifications/:id/read

Marks notification as read.

---

# 6. Dashboard APIs

Base Route

```
/api/dashboard
```

| Method | Endpoint | Authentication | Purpose |
|----------|------------|----------------|----------|
| GET | /overview | Yes | Dashboard Summary |
| GET | /trending-categories | Yes | Trending Categories |
| GET | /trending-assets | Yes | Trending Assets |
| GET | /recent-rentals | Yes | Recent Rentals |
| GET | /analytics | Yes | Dashboard Analytics |

---

## GET /api/dashboard/overview

Returns

- Total Assets
- Rentals Completed
- Rentals Taken
- Trust Score
- Average Rating
- Active Rentals
- Pending Requests

---

## GET /api/dashboard/trending-categories

Returns

Most rented categories.

---

## GET /api/dashboard/trending-assets

Returns

Most rented assets.

---

## GET /api/dashboard/recent-rentals

Returns

Recent rental activities.

Supports

```
limit
```

---

## GET /api/dashboard/analytics

Returns

- Total Rentals
- Status Breakdown
- Total Earnings
- Total Spending

---

# HTTP Status Codes

| Status | Description |
|----------|-------------|
| 200 | Success |
| 201 | Resource Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

# API Request Flow

```
Client
   │
   ▼
HTTP Request
   │
   ▼
Express Route
   │
   ▼
Middleware
(Authentication / Validation)
   │
   ▼
Controller
   │
   ▼
Service Layer
   │
   ▼
Supabase Client
   │
   ▼
PostgreSQL Database
   │
   ▼
Controller
   │
   ▼
JSON Response
   │
   ▼
Frontend
```

---

# Backend Business Rules

- JWT authentication is required for protected endpoints.
- Passwords are securely hashed using bcrypt.
- Users cannot rent their own assets.
- Only asset owners can update or delete assets.
- Reviews are allowed only after rental completion.
- Notification APIs are accessible only to authenticated users.
- Assets are soft deleted using the `is_active` flag.
- Rental status follows a controlled lifecycle.
- All API responses follow a standardized JSON format.

# Core Functionalities

LendLoop provides a complete rental lifecycle, starting from user registration to rental completion and user reviews. The platform focuses on secure authentication, community asset sharing, rental negotiation, and trust building through ratings and notifications.

---

# Functional Modules

## 1. User Authentication

The authentication module secures user access to the platform using JWT-based authentication.

### Features

- User Registration
- User Login
- JWT Authentication
- Password Encryption using bcrypt
- Protected Routes
- User Profile

---

## 2. Asset Management

Registered users can list their assets for rent and manage their inventory.

### Features

- Create Asset Listing
- Edit Asset Details
- Delete Asset (Soft Delete)
- Browse Available Assets
- Search Assets
- Nearby Asset Discovery
- Asset Availability Management

---

## 3. Rental Management

The rental module manages the complete rental lifecycle between owners and borrowers.

### Features

- Send Rental Request
- Price Negotiation
- Counter Offer
- Accept Rental
- Reject Rental
- Cancel Rental
- Complete Rental
- Rental History

---

## 4. Reviews & Ratings

Reviews improve trust between community members.

### Features

- Submit Review
- Rate Users
- View User Reviews
- Automatic Average Rating Calculation

---

## 5. Notification System

Keeps users informed throughout the rental process.

### Features

- Rental Request Notification
- Counter Offer Notification
- Acceptance Notification
- Rejection Notification
- Completion Notification
- Mark Notification as Read

---

## 6. Dashboard

Provides a summary of user activities.

### Features

- Dashboard Overview
- Trending Categories
- Trending Assets
- Recent Rentals
- Analytics

---

# Complete Rental Workflow

```
Owner
 │
 │ Create Asset
 ▼
Asset Listed
 │
 │
 ▼
Borrower Browses Assets
 │
 ▼
Borrower Sends Rental Request
 │
 ▼
Owner Receives Request
 │
 ├────────────► Reject
 │
 ├────────────► Counter Offer
 │                    │
 │                    ▼
 │            Borrower Accepts
 │
 ▼
Owner Accepts
 │
 ▼
Rental Confirmed
 │
 ▼
Rental Completed
 │
 ▼
Users Submit Reviews
 │
 ▼
Dashboard Statistics Updated
```

---

# Frontend–Backend Integration

The frontend communicates with the backend exclusively through REST APIs.

```
React Component
      │
      ▼
API Service
      │
      ▼
Axios Request
      │
      ▼
Express Route
      │
      ▼
Controller
      │
      ▼
Service Layer
      │
      ▼
Supabase
      │
      ▼
JSON Response
      │
      ▼
React UI Update
```

---

# Backend Architecture

The backend follows the MVC (Model–View–Controller) architecture with a Service Layer.

```
Client Request
      │
      ▼
Routes
      │
      ▼
Validation Middleware
      │
      ▼
Authentication Middleware
      │
      ▼
Controller
      │
      ▼
Business Logic (Services)
      │
      ▼
Supabase Client
      │
      ▼
PostgreSQL Database
      │
      ▼
Response
```

---

# Security Features

The application incorporates several security mechanisms to protect user accounts and application data.

### Authentication

- JWT Token Authentication
- Protected API Endpoints

### Password Security

- bcrypt Password Hashing

### Authorization

- Owner-only Asset Updates
- Owner-only Asset Deletion
- Protected Rental Operations

### Validation

- Request Validation
- Input Validation
- Standardized Error Responses

---

# Standard Backend Response

Every API follows a common response structure.

## Success Response

```json
{
    "success": true,
    "message": "Operation Successful",
    "data": {}
}
```

---

## Error Response

```json
{
    "success": false,
    "message": "Error Message",
    "errors": []
}
```

---

# Deployment Architecture

```
                    Internet
                        │
        ┌───────────────┼────────────────┐
        │                               │
        ▼                               ▼
Frontend (Vercel)               Backend (Render)
        │                               │
        └───────────────REST API─────────┘
                        │
                        ▼
              Supabase PostgreSQL
```

---

# Environment Variables

## Backend

| Variable | Purpose |
|----------|----------|
| PORT | Server Port |
| NODE_ENV | Runtime Environment |
| SUPABASE_URL | Supabase Project URL |
| SUPABASE_SERVICE_ROLE_KEY | Supabase Service Role Key |
| JWT_SECRET | JWT Secret |
| JWT_EXPIRES_IN | Token Expiry |
| CLIENT_URL | Frontend URL |

---

# Installation Guide

## Backend

```bash
git clone <repository-url>

cd lendloop-backend

npm install

cp .env.example .env

npm run dev
```

---

## Frontend

```bash
cd lendloop-frontend

npm install

npm run dev
```

---

# Deployment

## Frontend

- Vercel

## Backend

- Render

## Database

- Supabase PostgreSQL

---

# Future Scope

The following enhancements are identified for future development:

- Multiple image upload support for assets.
- Image gallery with slider on asset detail pages.
- Asset image management during editing.
- In-app chat between asset owner and borrower for rental negotiations.

---

# Project Highlights

- Full Stack Web Application
- RESTful API Architecture
- JWT Authentication
- Secure Password Hashing
- MVC Backend Architecture
- PostgreSQL Relational Database
- Community Asset Sharing
- Rental Negotiation Workflow
- Review & Rating System
- Notification Management
- Dashboard Analytics
- Deployed Frontend and Backend

---

# Conclusion

LendLoop demonstrates a complete end-to-end implementation of a community asset rental platform. The project integrates a React-based frontend, an Express.js REST API backend, and a PostgreSQL database hosted on Supabase. It implements secure authentication, structured database design, modular backend architecture, standardized API responses, and a complete rental lifecycle from asset listing to review submission.

The modular architecture allows future enhancements while maintaining a clear separation between presentation, business logic, and data layers.
