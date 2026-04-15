# Auth Module

## Current Foundation
- `db/schema.ts`: auth-owned database tables for `users` and `sessions`
- `server/password.ts`: reusable password hashing and verification helpers
- `server/email.ts`: shared email normalization and format validation for auth
  entry points
- `server/register.ts`: minimal server-side registration helper built on auth
  schema and helpers
- `server/login.ts`: minimal server-side login helper that validates
  credentials and creates a session
- `server/session.ts`: server-side session persistence and cookie helpers
- `server/logout.ts`: minimal logout helper that removes the current session
- `server/current-user.ts`: current session and authenticated-user helpers for
  route-level server guards

## Current Behavior
- `/register` supports email/password signup with validation and duplicate-email
  handling.
- `/login` supports email/password signin and issues a server-side session.
- Authenticated dashboard state on `/` and `/reservations` relies on the same
  server-side session foundation.
- Auth state stays server-first through the `sessions` table and an HTTP-only
  cookie.
- The same auth foundation now backs owner wishlist bootstrap and item CRUD on
  the protected dashboard.

## Test Coverage
- Unit and integration-like tests cover registration, login, logout, session
  helpers, current user lookup, and protected route guards.
- Minimal e2e checks cover the login form and unauthenticated redirects to
  `/login`.

## Scope
- Keep auth helpers inside the `auth` module until there is a proven reuse case
- Registration, login, logout, and session guards should build on these helpers
  instead of duplicating password or email handling
