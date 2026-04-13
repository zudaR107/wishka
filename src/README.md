# Source Structure

## Top-Level Areas
- `src/app`: routing, layouts, route handlers, and route-local composition
- `src/modules`: feature and cross-cutting module entry points
- `src/shared`: code that is safe to reuse across modules, including DB foundation

## Current State
- `src/app/login` and `src/app/register` contain working auth entry flows.
- `src/app/app` is a server-rendered owner dashboard with wishlist bootstrap,
  read state, item CRUD, share-link controls, and privacy-safe reserved status.
- `src/app/app/reservations` is now a protected reserver page with active
  reservations and cancel flow.
- `src/app/healthz` is a public-safe health route used by compose, reverse
  proxy, and deploy verification flows.
- `src/app/share/[token]` is now a real public route backed by the `share`
  module with reservation-aware loading and reserve flow.
- `wishlist` is now an active feature module.
- `share` is now an active feature module with schema, owner lifecycle helpers,
  public loading, and route rendering.
- `reservation` is now an active feature module with schema, lifecycle rules,
  owner/public/reserver read models, and reservation flows.

## Module Areas
- `auth`
- `wishlist`
- `item`
- `share`
- `reservation`
- `ui`
- `i18n`

## Import Conventions
- Use `@/app/*` only for route files and route-local composition.
- Use `@/modules/<name>/*` for module-owned code.
- Use `@/shared/*` for reusable code with no feature ownership.

## Boundary Rules
- `src/shared` must not depend on feature modules.
- Modules must not import from another module's internals.
- Cross-module reuse should happen through `src/shared` or a module's public entry.
- Route files in `src/app` may compose modules and shared code, but should not become a dumping ground for domain logic.
- Keep the smallest correct structure; add deeper folders only when real code needs them.
