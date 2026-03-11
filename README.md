# Movidex API - Backend REST Server

The Express.js backend that powers both the Movidex user frontend and admin panel. Handles authentication, movie CRUD, user management, reviews, ratings, and watchlists.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Server Architecture](#server-architecture)
- [Database Models](#database-models)
- [Middleware](#middleware)
- [API Reference](#api-reference)
- [Security](#security)
- [Error Handling](#error-handling)

---

## Overview

This is a Node.js/Express RESTful API that:
- Authenticates users with JWT tokens (register, login)
- Serves movie data with search, filter, and pagination
- Manages user watchlists stored in MongoDB
- Handles movie reviews (text) and ratings (1-5 stars)
- Provides admin endpoints for movie CRUD and user management
- Implements production-grade security (rate limiting, input sanitization, helmet headers)

**Base URL:** `http://localhost:5000`
**API Prefix:** `/api`

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| express | 5.1.0 | HTTP server and routing framework |
| mongoose | 8.16.0 | MongoDB object modeling (schemas, validation, queries) |
| jsonwebtoken | 9.0.2 | JWT token creation and verification |
| bcryptjs | 3.0.2 | Password hashing (bcrypt with cost factor 10) |
| helmet | 8.1.0 | Security headers (CSP, HSTS, X-Frame-Options, etc.) |
| express-rate-limit | 8.3.1 | Request rate limiting on auth endpoints |
| mongo-sanitize | 1.1.0 | Strips MongoDB query operators from user input |
| cors | 2.8.5 | Cross-Origin Resource Sharing configuration |
| dotenv | 16.5.0 | Environment variable loading from .env file |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

### Install
```bash
cd movidex-api
npm install
```

### Configure
Create a `.env` file in this directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/movie_plux
JWT_SECRET=your_64_char_random_hex_string
JWT_EXPIRATION=7d
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Run
```bash
npm start
```

Expected output:
```
Server running on http://localhost:5000
MongoDB connected
```

Verify: `curl http://localhost:5000` should return "Moviedux API is running!"

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | - | Server port number |
| `MONGO_URI` | Yes | - | MongoDB connection string. Local: `mongodb://127.0.0.1:27017/movie_plux`. Atlas: `mongodb+srv://...` |
| `JWT_SECRET` | Yes | - | Secret key for signing/verifying JWT tokens. Use a cryptographically random string of 64+ characters. |
| `JWT_EXPIRATION` | No | `7d` | Token lifetime. Formats: `15m` (15 min), `1h` (1 hour), `7d` (7 days), `30d` (30 days) |
| `CORS_ORIGINS` | No | `localhost:3000,3001,3002` | Comma-separated allowed origins. If omitted, defaults to localhost on ports 3000, 3001, and 3002. |

---

## Server Architecture

### Startup Sequence (server.js)

```
1. Load environment variables (dotenv)
2. Create Express app
3. Apply helmet() for security headers
4. Configure CORS with origin whitelist
5. Apply express.json({ limit: '10kb' }) body parser
6. Mount root GET / health check route
7. Mount /api/users routes (userRoutes.js)
8. Mount /api/movies routes (moviesRoutes.js)
9. Mount 404 catch-all for unknown routes
10. Connect to MongoDB via mongoose.connect()
11. Start HTTP server on PORT (only after DB connects)
12. If DB fails, log error and process.exit(1)
```

### Middleware Chain (per request)

```
Request
  |
  v
helmet()             -- Sets 15+ security HTTP headers
  |
  v
cors()               -- Checks Origin header against whitelist
  |
  v
express.json()       -- Parses JSON body (rejects >10kb)
  |
  v
[Rate Limiter]       -- Only on /register and /login (10 req/15min)
  |
  v
auth()               -- Verifies JWT from Authorization header
  |                      Attaches req.user = { id, username, role }
  v
Route Handler        -- Business logic for the endpoint
  |
  v
Response
```

---

## Database Models

### User Model (models/User.js)

**Collection name:** `user`

| Field | Type | Details |
|-------|------|---------|
| `username` | String | **Unique**. Validated on input: 3-30 chars, alphanumeric + underscores |
| `password` | String | Bcrypt hash (cost 10). Original password is never stored. |
| `watchlist` | [ObjectId] | Array of references to Movies collection. Populated on fetch. |
| `role` | String | Enum: `'user'` or `'admin'`. Default: `'user'` |

**Example document:**
```json
{
  "_id": "665a1b2c3d4e5f6789012345",
  "username": "john_doe",
  "password": "$2a$10$hashed_password_here",
  "watchlist": ["665a1c...", "665a1d..."],
  "role": "user"
}
```

### Movie Model (models/Movies.js)

**Collection name:** `movieslist`

| Field | Type | Details |
|-------|------|---------|
| `id` | Number | Custom movie ID |
| `title` | String | Movie title |
| `image` | String | Image filename (e.g., `dark_knight.jpg`). Served from frontend `public/images/` |
| `genre` | String | Comma-separated genres (e.g., `"Action, Crime, Drama"`) |
| `rating` | Number | Overall rating (1-10 scale, set by admin) |
| `description` | String | Movie description/synopsis |
| `reviews` | [ReviewSchema] | Embedded array of user reviews |
| `ratings` | [RatingSchema] | Embedded array of user ratings |

**ReviewSchema (embedded):**

| Field | Type | Details |
|-------|------|---------|
| `user` | ObjectId | Reference to User who wrote the review |
| `text` | String | Review text content |
| `date` | Date | When the review was submitted (default: now) |

**RatingSchema (embedded):**

| Field | Type | Details |
|-------|------|---------|
| `user` | ObjectId | Reference to User who rated |
| `value` | Number | Rating value, min: 1, max: 5 |

**Example document:**
```json
{
  "_id": "665a1c...",
  "id": 1,
  "title": "The Dark Knight",
  "image": "dark_knight.jpg",
  "genre": "Action, Crime, Drama",
  "rating": 9,
  "description": "When the menace known as the Joker...",
  "reviews": [
    {
      "user": "665a1b...",
      "text": "Masterpiece!",
      "date": "2026-03-10T12:00:00.000Z"
    }
  ],
  "ratings": [
    { "user": "665a1b...", "value": 5 }
  ]
}
```

---

## Middleware

### auth.js - JWT Authentication

**Location:** `middleware/auth.js`

**What it does:**
1. Reads the `Authorization` header from the request
2. Extracts the token (format: `Bearer <token>`)
3. Calls `jwt.verify(token, secret, { algorithms: ['HS256'] })` to validate
4. If valid, attaches the decoded payload to `req.user`:
   ```json
   { "id": "665a...", "username": "john_doe", "role": "user" }
   ```
5. Calls `next()` to pass to the route handler
6. If invalid/missing, returns `401 { error: "Invalid token" }`

**Algorithm restriction:** Only `HS256` is accepted. This prevents algorithm confusion attacks where an attacker could switch to `none` or `RS256` with a crafted key.

**Applied to:** All `/api/movies` routes and most `/api/users` routes (except register and login).

---

## API Reference

### Health Check

```
GET /
```
Returns: `"Moviedux API is running!"`

---

### POST /api/users/register

Creates a new user account.

**Rate limited:** 10 requests per 15 minutes per IP address.

**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "username": "john_doe",
  "password": "MyStr0ngP@ss12"
}
```

**Input validation pipeline:**
1. `mongo-sanitize` strips any MongoDB operators from username/password
2. Type check: both must be strings
3. Username format: `/^[a-zA-Z0-9_]{3,30}$/` (3-30 chars, alphanumeric + underscore)
4. Uniqueness: checks if username already exists in DB
5. Password strength: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!%*?&#]).{12,}$/`
   - At least 12 characters
   - At least 1 lowercase letter
   - At least 1 uppercase letter
   - At least 1 digit
   - At least 1 special character from: `@!%*?&#`
6. Password is hashed with bcrypt (cost factor 10) before saving

**Responses:**

| Status | Body | When |
|--------|------|------|
| 201 | `{ "message": "User registered" }` | Success |
| 400 | `{ "error": "Username and password are required" }` | Missing fields |
| 400 | `{ "error": "Username and password must be strings" }` | Wrong types |
| 400 | `{ "error": "Username must be 3-30 characters..." }` | Invalid format |
| 400 | `{ "error": "Password must be at least 12 characters..." }` | Weak password |
| 400 | `{ "error": "Username already exists" }` | Duplicate |
| 429 | `{ "error": "Too many attempts..." }` | Rate limited |
| 500 | `{ "error": "Internal server error" }` | Server error |

---

### POST /api/users/login

Authenticates user and returns a JWT token.

**Rate limited:** 10 requests per 15 minutes per IP address.

**Body:**
```json
{
  "username": "john_doe",
  "password": "MyStr0ngP@ss12"
}
```

**Process:**
1. Sanitizes and validates input (same as register)
2. Finds user by username in MongoDB
3. Compares password hash with `bcrypt.compare()`
4. If match, creates JWT with `jwt.sign({ id, username, role }, secret, { expiresIn })`
5. Returns user info + token

**Success (200):**
```json
{
  "user": {
    "id": "665a1b2c3d4e5f6789012345",
    "username": "john_doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NWExYjJjM2Q0ZTVmNjc4OTAxMjM0NSIsInVzZXJuYW1lIjoiam9obl9kb2UiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0MTY4OTYwMCwiZXhwIjoxNzQyMjk0NDAwfQ.signature",
  "message": "Login success"
}
```

**Error (401):**
```json
{ "error": "Invalid credentials" }
```
Note: Same error for wrong username AND wrong password (prevents user enumeration).

---

### GET /api/movies

Returns movies with optional filtering, search, and pagination.

**Auth required:** Yes (Bearer token)

**Query parameters:**

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `search` | string | `?search=dark` | Case-insensitive title search. Special regex chars are escaped. |
| `genre` | string | `?genre=Action` | Exact genre match (case-insensitive) |
| `page` | number | `?page=2` | Page number for pagination (default: 1) |
| `limit` | number | `?limit=10` | Results per page. Use `0` for no limit. |

**Type safety:** `genre` and `search` must be strings (non-strings are rejected with 400). `page` and `limit` are parsed as integers.

**Example requests:**
```
GET /api/movies                              # All movies
GET /api/movies?search=inception             # Search by title
GET /api/movies?genre=Action&page=1&limit=5  # Filter + paginate
```

**Response (200):** Array of movie objects (see Movie Model above)

---

### GET /api/movies/:id

Returns a single movie with reviews populated (includes reviewer usernames).

**Auth required:** Yes

**Response (200):**
```json
{
  "_id": "665a1c...",
  "title": "The Dark Knight",
  "reviews": [
    {
      "user": { "_id": "665a1b...", "username": "john_doe" },
      "text": "Masterpiece!",
      "date": "2026-03-10T12:00:00.000Z"
    }
  ],
  "ratings": [{ "user": "665a1b...", "value": 5 }]
}
```

Note: `reviews.user` is populated (contains username), while `ratings.user` is just the ObjectId reference.

---

### POST /api/movies/:id/review

Adds a review and rating to a movie.

**Auth required:** Yes

**Body:**
```json
{
  "text": "Absolutely incredible cinematography!",
  "rating": 5
}
```

**Validation:**
- `text` must be a non-empty string (trimmed)
- `rating` must be an integer between 1 and 5 (checked with `Number.isInteger()`)
- One review per user per movie (checks existing `reviews.user` and `ratings.user`)

**Responses:**

| Status | Body | When |
|--------|------|------|
| 200 | Updated movie object | Success |
| 400 | `{ "error": "Review text is required" }` | Empty or non-string text |
| 400 | `{ "error": "Rating must be an integer between 1 and 5" }` | Invalid rating |
| 400 | `{ "error": "You have already reviewed this movie." }` | Duplicate review |
| 404 | `{ "error": "Movie not found" }` | Invalid movie ID |
| 500 | `{ "error": "Internal server error" }` | Server error |

---

### POST /api/movies (Admin only)

Creates a new movie.

**Auth required:** Yes (admin role)

**Body:**
```json
{
  "title": "New Movie",
  "genre": "Action, Thriller",
  "rating": 8.5,
  "image": "new_movie.jpg",
  "description": "A thrilling adventure..."
}
```

**Response (201):** Created movie object

**Error (403):** `{ "error": "Must be admin" }` if `req.user.role !== 'admin'`

---

### PUT /api/movies/:id (Admin only)

Updates an existing movie. Same body structure as POST.

**Response (200):** Updated movie object

---

### DELETE /api/movies/:id (Admin only)

Permanently deletes a movie and all its reviews/ratings.

**Response (200):** `{ "message": "..." }`

---

### GET /api/users (Admin only)

Returns all users without password fields.

**Auth required:** Yes (admin role)

**Response (200):**
```json
[
  { "_id": "665a...", "username": "john_doe", "role": "user", "watchlist": [...] },
  { "_id": "665b...", "username": "admin_user", "role": "admin", "watchlist": [] }
]
```

---

### PUT /api/users/:id (Admin only)

Updates a user's username and/or role.

**Body:**
```json
{ "username": "new_username", "role": "admin" }
```

**Response (200):** Updated user object (without password)

---

### GET /api/users/:id/watchlist

Returns the authenticated user's watchlist with full movie details.

**Auth required:** Yes (must be the owner of the watchlist - `req.user.id === :id`)

**Response (200):**
```json
{
  "watchlist": [
    { "_id": "665a...", "title": "The Dark Knight", "genre": "Action", ... },
    { "_id": "665b...", "title": "Inception", "genre": "Sci-Fi", ... }
  ]
}
```

---

### POST /api/users/:id/watchlist

Replaces the user's entire watchlist.

**Auth required:** Yes (must be owner)

**Body:**
```json
{
  "watchlist": ["665a1c...", "665a1d...", "665a1e..."]
}
```

**Validation:**
- `watchlist` must be an array
- Every element must be a valid MongoDB ObjectId (checked with `mongoose.Types.ObjectId.isValid()`)

**Response (200):** `{ "watchlist": [...] }` (populated with movie objects)

---

### GET /api/users/details (Admin only)

Aggregates all users with their reviews, ratings, and watchlists from across all movies.

**Response (200):**
```json
[
  {
    "_id": "665a...",
    "username": "john_doe",
    "role": "user",
    "watchlist": [{ "title": "The Dark Knight", ... }],
    "reviews": [{ "movieTitle": "...", "text": "Great!", "date": "..." }],
    "ratings": [{ "movieTitle": "...", "value": 5 }]
  }
]
```

---

## Security

### Implemented protections

| Layer | Protection | Details |
|-------|-----------|---------|
| HTTP | `helmet()` | Sets 15+ security headers including CSP, HSTS, X-Frame-Options |
| HTTP | CORS whitelist | Only origins in `CORS_ORIGINS` env var are allowed |
| HTTP | Body limit | `express.json({ limit: '10kb' })` prevents memory exhaustion |
| Auth | Rate limiting | `/register` and `/login` limited to 10 requests per 15 minutes |
| Auth | JWT HS256 lock | Explicit algorithm prevents confusion attacks |
| Auth | bcrypt hashing | Cost factor 10, passwords never stored in plain text |
| Auth | Password policy | 12+ chars, mixed case, digit, special char required |
| Input | mongo-sanitize | Strips `$gt`, `$ne`, `$or` etc. from all auth inputs |
| Input | Type checking | `typeof` guards on every user-provided value |
| Input | Regex escaping | Search strings have `.*+?^${}()|\[\]\\` escaped before use in regex |
| Input | ObjectId validation | Watchlist entries validated with `mongoose.Types.ObjectId.isValid()` |
| Output | Generic errors | Catch blocks log real error server-side, return "Internal server error" to client |
| Route | 404 handler | Unknown routes return `{ error: "Route not found" }` instead of Express default |

---

## Error Handling

All routes follow a consistent error handling pattern:

```javascript
try {
  // Business logic
} catch (err) {
  console.error(err);                           // Log real error server-side
  res.status(500).json({ error: 'Internal server error' });  // Generic response to client
}
```

**Why generic errors?** Detailed error messages (stack traces, field names, query structure) can reveal internal architecture to attackers. By only logging the real error on the server and returning a generic message to the client, we prevent information disclosure.

**Error response format:** All errors follow the pattern:
```json
{ "error": "Human-readable error message" }
```

| Status Code | Meaning |
|------------|---------|
| 400 | Bad Request - invalid input (format, type, or business rule) |
| 401 | Unauthorized - missing, invalid, or expired JWT token |
| 403 | Forbidden - valid token but insufficient permissions (not admin) |
| 404 | Not Found - resource does not exist or route is undefined |
| 429 | Too Many Requests - rate limit exceeded |
| 500 | Internal Server Error - unexpected failure (details logged server-side) |
