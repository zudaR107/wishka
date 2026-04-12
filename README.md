# Wshka

Minimal, fast wishlist app.

## Status
Milestone 5 complete. Reservation flow is in place.

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
- Milestone 6: delivery and ops.

## Current Capabilities
- Email/password registration.
- Email/password login and logout.
- Server-side sessions with HTTP-only auth cookie.
- Server-side protection for `/app` and `/app/reservations`.
- Automatic current wishlist bootstrap for authenticated owners.
- Server-rendered owner dashboard with empty state and item list.
- Owner-side wishlist item create, update, and delete flows.
- Owner-side share-link create, revoke, and regenerate flows on `/app`.
- Public wishlist access on `/share/[token]` by active opaque token.
- Predictable unavailable state for invalid, inactive, and revoked share links.
- Reservation lifecycle helpers with active/inactive history and ownership rules.
- Reservation-aware public wishlist loading without reserver identity leakage.
- Public reservation create flow for authenticated non-owners on `/share/[token]`.
- Privacy-safe reserved status on the owner dashboard `/app`.
- Current-user reservations page and cancel flow on `/app/reservations`.
- Focused reservation coverage across helper logic and owner/public/reserver routes.

## Project Docs
- Product and delivery plan: `master-plan.md`
- Agent guidance: `AGENTS.md`

## License
MIT
