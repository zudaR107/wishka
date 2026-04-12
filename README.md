# Wishka

Minimal, fast wishlist app.

## Status
Milestone 4 complete. Public share-link flow is in place.

## Core Idea
Create a wishlist, share it by link, and let another person reserve an item.

## Planned Stack
- Next.js
- TypeScript
- PostgreSQL
- Drizzle
- Tailwind
- Radix
- Vitest
- Playwright
- Docker Compose
- Caddy

## Project Rules
- `v1.0.0` stays minimal: email/password auth, one wishlist per user in UI, item CRUD, public share link, reservation flow, Russian UI, and light theme.
- Releases follow SemVer.
- Commits follow Conventional Commits.
- `main` is protected and updated only through PRs.

## Current Focus
- Milestone 5: reservations.

## Current Capabilities
- Email/password registration.
- Email/password login and logout.
- Server-side sessions with HTTP-only auth cookie.
- Server-side protection for `/app` and `/app/reservations`.
- Automatic current wishlist bootstrap for authenticated owners.
- Server-rendered owner dashboard with empty state and item list.
- Owner-side wishlist item create, update, and delete flows.
- Owner-side share-link create, revoke, and regenerate flows on `/app`.
- Public read-only wishlist access on `/share/[token]` by active opaque token.
- Predictable unavailable state for invalid, inactive, and revoked share links.
- Focused share coverage across server helpers and route rendering states.

## Project Docs
- Product and delivery plan: `master-plan.md`
- Agent guidance: `AGENTS.md`

## License
MIT
