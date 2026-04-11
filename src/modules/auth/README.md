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

## Scope
- Keep auth helpers inside the `auth` module until there is a proven reuse case
- Registration, login, logout, and session guards should build on these helpers
  instead of duplicating password or email handling
