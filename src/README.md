# Source Structure

## Top-Level Areas
- `src/app`: routing, layouts, route handlers, and route-local composition
- `src/modules`: feature and cross-cutting module entry points
- `src/shared`: code that is safe to reuse across modules, including DB foundation

## Current State
- `src/app/login` and `src/app/register` contain working auth entry flows.
- `src/app/app` is a server-rendered owner dashboard with wishlist bootstrap,
  read state, item CRUD, and share-link controls.
- `src/app/app/reservations` remains a protected placeholder for a later
  milestone.
- `src/app/share/[token]` is now a real public read-only route backed by the
  `share` module.
- `wishlist` is now an active feature module.
- `share` is now an active feature module with schema, owner lifecycle helpers,
  public loading, and route rendering.
- `reservation` now has its DB schema foundation in place for later milestone
  issues.

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
