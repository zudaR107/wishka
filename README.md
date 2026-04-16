# Wshka

[![CI](https://github.com/zudar107/wshka/actions/workflows/baseline-pr-validation.yml/badge.svg)](https://github.com/zudar107/wshka/actions/workflows/baseline-pr-validation.yml)
[![Release](https://img.shields.io/github/v/release/zudar107/wshka)](https://github.com/zudar107/wshka/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A minimal, fast wishlist app. Create a wishlist, share it by link, let
another person reserve a gift.

**Live:** [wshka.ru](https://wshka.ru)

## What it does

- Create an account and add items to your wishlist
- Share a public link with friends or family
- They reserve what they plan to give — no duplicates, no spoilers
- You see what's reserved without knowing who reserved it

## Screenshots

<!-- TODO: replace placeholders with actual screenshots -->
<!-- Screenshot 1: Owner dashboard — authenticated view of / with wishlist items and share link -->
<!-- Screenshot 2: Public wishlist — /share/[token] as seen by a logged-in reserver -->
<!-- Screenshot 3: Reservations page — /reservations with an active booking and cancel button -->

## Stack

Next.js · TypeScript · PostgreSQL · Drizzle · Tailwind · Vitest · Playwright ·
Docker Compose · Caddy

## Development

```bash
# Install dependencies
npm ci

# Start dev server (clears .next first to avoid conflicts with prod builds)
npm run dev
```

Requires a local PostgreSQL database. Copy `.env.example` to `.env.local` and
set `DATABASE_URL`.

```bash
# Apply migrations
npm run db:migrate

# Type check
npm run typecheck

# Unit tests
npm run test:unit

# E2E tests (requires running server)
npm run test:e2e
```

See `docs/COMMANDS.md` for the full command reference.

## Production build

```bash
npm run build && npm run start
```

## Docker

```bash
# Build image
docker build -f ops/Dockerfile -t wshka-app .

# Run (requires external PostgreSQL in .env.docker.local)
docker run --rm -p 3000:3000 --env-file .env.docker.local wshka-app
```

See `docs/runtime-environment.md` for the full runtime env contract and
`docs/delivery-validation.md` for the release and deploy runbook.

## Project docs

| Document | Purpose |
|---|---|
| `docs/master-plan.md` | Product scope, milestones, roadmap |
| `docs/COMMANDS.md` | Full command reference |
| `docs/runtime-environment.md` | Runtime env contract and deploy foundation |
| `docs/delivery-validation.md` | Release and deploy validation runbook |
| `docs/AGENTS.md` | Agent guidance |

## License

MIT
