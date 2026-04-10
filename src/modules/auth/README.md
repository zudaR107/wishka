# Auth Module

## Current Foundation
- `db/schema.ts`: auth-owned database tables for `users` and `sessions`
- `server/password.ts`: reusable password hashing and verification helpers
- `server/email.ts`: shared email normalization for auth entry points

## Scope
- Keep auth helpers inside the `auth` module until there is a proven reuse case
- Registration, login, logout, and session guards should build on these helpers
  instead of duplicating password or email handling
