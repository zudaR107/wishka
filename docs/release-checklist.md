# v1.0.0 Release Checklist

Use this checklist before creating the `v1.0.0` tag.

## Pre-Tag
- [ ] `git status --short --branch` shows only intentional release-prep changes.
- [ ] `npm pkg get version` returns `"1.0.0"`.
- [ ] `git tag -l 'v1.0.0'` returns nothing.
- [ ] The target release commit SHA is recorded.
- [ ] Tag command is prepared but not executed yet: `git tag -a v1.0.0 <sha> -m "v1.0.0"`.

## Build
- [ ] `npm ci`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run test:unit`
- [ ] `npm run test:e2e`

## Environment
- [ ] Host-run runtime uses `.env.local` only on the local machine and it is not committed.
- [ ] Container runtime uses `.env.docker.local` only for direct `docker run` verification.
- [ ] VPS runtime uses `.env.compose.production` and keeps secrets out of git.
- [ ] `DATABASE_URL` is present for migrations and all DB-backed runtime flows.
- [ ] `DATABASE_SSL` is reviewed for the target environment.
- [ ] `HOSTNAME` and `PORT` are only set when overriding the runtime defaults.
- [ ] Missing `DATABASE_URL` fails explicitly in `npm run db:migrate`.
- [ ] Missing `DATABASE_URL` fails explicitly on DB-backed runtime actions or pages.

## Database
- [ ] Fresh database migration succeeds: `npm run db:migrate`.
- [ ] Re-running `npm run db:migrate` succeeds without manual cleanup.
- [ ] Current release does not require schema rollback.
- [ ] Rollback rehearsal result for the candidate commit is recorded.

## Runtime And Routes
- [ ] `npm run start` serves `GET /healthz` with `200` and `{"status":"ok"}`.
- [ ] Guest `/` renders the public entry state.
- [ ] Authenticated `/` renders the owner dashboard.
- [ ] `/login` renders for guests.
- [ ] `/register` renders for guests.
- [ ] Guest `/reservations` redirects to `/login`.
- [ ] Authenticated logout removes access to `/reservations`.
- [ ] Valid `/share/[token]` renders the public wishlist.
- [ ] Invalid `/share/[token]` renders the unavailable state.

## Auth, Share, Reservations
- [ ] Register -> login -> owner dashboard works in production-like runtime.
- [ ] Owner can create a share link on `/`.
- [ ] Guest can open the share page but cannot reserve.
- [ ] Authenticated non-owner can reserve from `/share/[token]`.
- [ ] `/reservations` lists active reservations and supports cancellation.
- [ ] Owner sees reserved status without reserver identity leakage.

## Docker
- [ ] `docker build -f ops/Dockerfile -t wshka-app .`
- [ ] `docker run ... wshka-app` serves `/healthz`.
- [ ] `docker run ... node /app/ops/deploy/run-migrations.mjs` succeeds.
- [ ] `docker compose build app`
- [ ] `docker compose up -d postgres`
- [ ] `docker compose run --rm --no-deps app node /app/ops/deploy/run-migrations.mjs`
- [ ] `docker compose up -d app caddy`
- [ ] Compose-exposed `/healthz` returns `200`.

## Rollback
- [ ] Previous known-good immutable image tag is identified.
- [ ] `docs/delivery-validation.md` rollback steps are still accurate.
- [ ] Rollback target starts on the same DB contract.
- [ ] Existing sessions, share links, and reservations still work after rollback.

## Health Checks
- [ ] `/healthz` returns the expected JSON body.
- [ ] App logs show no unexpected server exceptions during auth, share, or reservation flows.
- [ ] Container and compose logs show no silent failures for the checked flows.

## Known Risks
- Next.js build output is not byte-for-byte reproducible yet. `BUILD_ID` and generated server artifacts change between clean builds.
- `/healthz` is a process-level availability check. It does not confirm live database connectivity.
- The MVP still ships with the current scope limits: Russian-only UI, one active wishlist in UI, no email verification, no password reset, no images, and no dedicated monitoring stack beyond logs.

## Release Notes Draft
- Wshka `v1.0.0` is the first stable MVP release of a minimal wishlist app.
- It supports email/password auth, one current wishlist in the UI, item CRUD, public share links, reservation flow for authenticated non-owners, and a reserver-owned cancellation flow.
- It keeps the MVP limits intentionally narrow: Russian-only UI, one active wishlist in the UI, no email verification, no password reset, and no image support.
