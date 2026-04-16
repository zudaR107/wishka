# Wshka

A minimal, fast wishlist app. Create a wishlist, share it by link, let
another person reserve a gift.

**Live:** [wshka.ru](https://wshka.ru)

## What it does

- Create an account and add items to your wishlist
- Share a public link with friends or family
- They reserve what they plan to give — no duplicates, no spoilers
- You see what's reserved without knowing who reserved it

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
| `docs/release-checklist.md` | Pre-release validation checklist |
| `docs/runtime-environment.md` | Runtime env contract and deploy foundation |
| `docs/delivery-validation.md` | Release and deploy validation runbook |
| `docs/AGENTS.md` | Agent guidance |

## License

MIT
