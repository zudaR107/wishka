# AGENTS.md

## Mission
Build Wshka: a minimal, fast wishlist app.
Core flow: create wishlist → share link → reserve gift.

## Current Status
`v1.0.0` shipped. Next focus: `v1.1.0` (multiple wishlists, prioritization,
account profile data). See `docs/master-plan.md` for full roadmap.

## v1.0.0 Scope (shipped)
- email/password auth with auto-login after registration
- one wishlist per user in UI
- wishlist item CRUD (title, url, note, price)
- public share link (create, revoke, regenerate)
- reservation by another authenticated user
- owner sees reserved status without reserver identity
- reserver can cancel their own reservation
- Russian locale, light theme, full CI/CD

## Stack
Next.js, TypeScript, PostgreSQL, Drizzle, Tailwind,
Vitest, Playwright, Docker Compose, Caddy.

## Architecture Rules
- Modular monolith; keep module boundaries clear:
  `auth`, `wishlist`, `item`, `share`, `reservation`, `ui`, `i18n`, `shared`
- Server-first rendering, minimal client code
- All user-facing text through i18n keys
- All colors and theme values through design tokens
- Prefer the smallest correct change

## Domain Invariants
- One active wishlist per user in v1.0.0 — product rule, not schema limit
- Public access only through active share tokens
- Only authenticated non-owners can reserve items
- At most one active reservation per item
- Owners never see reserver identity

## Routes
| Route | Access |
|---|---|
| `/` | Guest landing / owner dashboard |
| `/login`, `/register` | Public |
| `/reservations` | Auth — reserver's active reservations |
| `/share/[token]` | Public — read-only wishlist |
| `/roadmap`, `/privacy`, `/terms` | Public |
| `/healthz` | Public-safe health check |

## Workflow
- Small PRs only; `main` protected; merge through PR
- Conventional Commits with 50/72 discipline
- Update tests and docs when behavior changes
- See `docs/master-plan.md` for milestones and process rules

## Deployment
One VPS: Docker Compose with `caddy + app + postgres`,
HTTPS on `wshka.ru`, deploy via GitHub Actions + GHCR.
Dockerfile at `ops/Dockerfile`; tool configs at `config/`.
