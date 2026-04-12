# AGENTS.md

## Mission
Build Wshka: a minimal, fast wishlist app focused on one core flow:
create wishlist -> share link -> reserve gift.

## Scope
Version `v1.0.0` includes:
- email/password auth
- one wishlist per user in UI
- wishlist item CRUD
- public share link
- reservation by another authenticated user
- owner sees reserved status without reserver identity
- reserver can cancel their own reservation

Version `v1.0.0` excludes:
- images
- dark mode
- English UI
- email verification
- password reset
- multiple wishlists in UI

## Stack
Next.js, TypeScript, PostgreSQL, Drizzle, Tailwind, Radix,
Vitest, Playwright, Docker Compose, Caddy.

## Architecture Rules
- Build a modular monolith.
- Keep module boundaries clear: `auth`, `wishlist`, `item`, `share`,
  `reservation`, `ui`, `i18n`, `shared`.
- Treat `wishlists` as a first-class entity from day one.
- Keep rendering server-first and client code minimal.
- Route all user-facing text through i18n keys.
- Route all colors and theme values through design tokens.
- Prefer the smallest correct change.

## Domain Invariants
- One active wishlist per user in `v1.0.0` is a product rule,
  not an architectural limitation.
- Public access is granted only through active share tokens.
- Only authenticated non-owners can reserve items.
- At most one active reservation exists per item.
- Owners never see reserver identity in `v1.0.0`.

## Workflow
- Work in small PRs.
- `main` is protected; merge only through PR.
- Use Conventional Commits with 50/72 discipline.
- Update tests and docs whenever behavior changes.
- Follow `master-plan.md` for milestones, route map, CI growth,
  deployment target, and release sequencing.

## PR Done
- single focused change
- relevant tests updated
- required CI checks green
- docs updated when needed
- no unrelated edits
- no hidden scope creep

## CI Expectations
- Early: repo validation, PR conventions, typecheck, build smoke,
  smoke tests.
- Later: integration tests, core e2e, container build, deploy checks.
- Release: semver release, changelog, production deploy, health check.

## Deployment Target
Production is one remote VPS running Docker Compose:
`caddy + app + postgres`, HTTPS on the project domain,
deploy via GitHub Actions and GHCR.

## Source Of Truth
`master-plan.md` is the source of truth for product scope,
milestones, backlog shape, and delivery rules.
