# Contributing to Wshka

Thank you for your interest in contributing!

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm

## Local dev setup

```bash
# 1. Clone the repo
git clone https://github.com/zudar107/wshka.git
cd wshka

# 2. Install dependencies
npm ci

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and set DATABASE_URL to your local PostgreSQL instance

# 4. Apply migrations
npm run db:migrate

# 5. Start the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Running tests

```bash
# Unit tests
npm run test:unit

# E2E tests (requires the dev server to be running in another terminal)
npm run test:e2e

# Type check
npm run typecheck
```

See `docs/COMMANDS.md` for the full command reference.

## Commit conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `test:` | Adding or updating tests |
| `chore:` | Tooling, dependencies, config |
| `refactor:` | Code change that is neither a fix nor a feature |

Examples:
```
feat(share): add QR code for share links
fix(auth): redirect to login on expired session
docs: update COMMANDS.md with new db scripts
```

## Branch naming

```
feat/<short-description>
fix/<short-description>
docs/<short-description>
chore/<short-description>
```

## Opening a pull request

1. Open an issue first for non-trivial changes — discuss the approach before writing code
2. Branch off `main`
3. Keep PRs small and focused on a single concern
4. Fill in the PR template — describe *what* changed and *why*
5. All CI checks must pass before merge
