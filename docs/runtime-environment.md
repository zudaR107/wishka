# Runtime Environment And Deploy Foundation

## Scope
- This document is the `M6-I1` foundation for runtime env rules and one-VPS deployment assumptions.
- It documents the contract that later Milestone 6 PRs should reuse.
- It does not define the production image, Docker Compose stack, Caddy config, GitHub Actions workflows, or deploy scripts.

## Runtime Env Contract

### App Runtime Variables
| Variable | Required | Secret | Environments | Purpose | Notes |
|---|---|---|---|---|---|
| `DATABASE_URL` | yes | yes | local, CI with DB work, production | PostgreSQL connection string for app runtime and Drizzle CLI | Required by `src/shared/db/env.ts` and `drizzle.config.ts` |
| `DATABASE_SSL` | no | no | local, CI, production | Enables PostgreSQL SSL mode when set to `true`, `1`, or `yes` | Default behavior is `false` |

### Current Non-Env Runtime Assumptions
- There is no separate auth secret env in `M6-I1`.
- Session tokens are opaque random values stored in the database.
- The auth cookie name is fixed in code as `wshka_session`.
- Production requires HTTPS so the secure auth cookie path works correctly.

### Public URL And Share-Link Assumptions
- There is no dedicated `APP_URL`, `SITE_URL`, or `NEXT_PUBLIC_*` runtime variable yet.
- Public share URLs are currently derived from the incoming request headers.
- The reverse proxy must preserve `Host` or `X-Forwarded-Host` and `X-Forwarded-Proto` so owner-facing share links render with the correct public origin.
- Local fallback remains `http://localhost:3000` when those headers are absent.
- A dedicated public base URL env may be introduced later only if delivery work proves it necessary.

## Environment Separation

### Local
- Store host-run values in `.env.local`.
- Store container-local verification values in a separate `.env.docker.local` file based on `.env.docker.example` when the database stays on the host machine.
- `.env.local` and `.env.docker.local` are gitignored and must not be committed.
- `.env.local` is for running the app directly on the host machine.
- Minimum local runtime contract:
  - `DATABASE_URL`
- Typical local value:
  - `DATABASE_SSL=false`
- Local development may use a directly reachable PostgreSQL instance on `localhost:5432`.

### CI
- Do not commit CI env files.
- Inject values at job runtime through GitHub Actions job env, repository secrets, or environment secrets.
- Jobs that only lint, typecheck, or validate docs may not need DB env.
- Any CI job that runs migrations, integration tests, or app code that touches the database must provide:
  - `DATABASE_URL`
- `DATABASE_SSL` is optional and depends on the CI database setup.

### Production
- Do not store production secrets in git or bake them into the image.
- Provide runtime values on the VPS through the future deployment runtime env file or service-level env injection.
- Minimum production app runtime contract:
  - `DATABASE_URL`
- Typical production runtime value:
  - `DATABASE_SSL=true` when the database connection requires SSL
- Production public origin is expected to be `https://wshka.ru`.

## Secrets Model
- Secrets never belong in tracked files, Docker image layers, or workflow YAML literals.
- Local secrets live in `.env.local` on the developer machine.
- CI secrets live in GitHub repository secrets or GitHub environment secrets.
- Production runtime secrets live on the VPS runtime env file or equivalent server-side secret storage.
- Non-secret deploy metadata may live in docs, workflow env, or repository variables.

## Deploy Automation Inputs
- These values are for later Milestone 6 automation work.
- They are not application runtime variables and are intentionally not added to `.env.example`.

| Input | Required | Secret | Expected Storage | Purpose |
|---|---|---|---|---|
| `PRODUCTION_HOST` | yes | no | GitHub environment variable or workflow env | Target VPS hostname or IP |
| `PRODUCTION_SSH_USER` | yes | no | GitHub environment variable or workflow env | SSH user for deploy access |
| `PRODUCTION_SSH_PORT` | no | no | GitHub environment variable or workflow env | SSH port, default `22` |
| `PRODUCTION_SSH_KEY` | yes | yes | GitHub environment secret | SSH private key for deploy workflow |
| `GHCR_IMAGE` | yes | no | workflow env or repository variable | Fully qualified image name to publish and deploy |

## One-VPS Production Target
- One Ubuntu LTS VPS.
- One production environment only.
- One public domain: `wshka.ru`.
- Expected runtime topology for later PRs:
  - `caddy` as public reverse proxy
  - `app` as Next.js runtime
  - `postgres` as persistent database
- Persistent storage is expected for PostgreSQL data and Caddy state.

## Ports And Health Check
- Public HTTP port: `80`
- Public HTTPS port: `443`
- App container or process port: `3000`
- PostgreSQL port: `5432`
- `/healthz` is the deploy verification endpoint.
- Expected health behavior for rollout checks:
  - `GET /healthz`
  - HTTP `200`
  - JSON body with `{"status":"ok"}`

## Container Runtime Surface
- The production container image runs the `Next.js standalone` server.
- The container listens on port `3000`.
- The image sets `NODE_ENV=production`, `HOSTNAME=0.0.0.0`, and `PORT=3000` as process defaults for the standalone server.
- The only application runtime env variables expected inside the container remain:
  - `DATABASE_URL`
  - `DATABASE_SSL`
- No secrets are baked into image layers.
- Local verification without Compose should use a container-specific env file when the database stays on the host machine.
- `.env.docker.example` documents the expected host alias pattern for that case.
- Local verification commands:
  - `docker build -t wshka-app .`
  - `docker run -p 3000:3000 --env-file .env.docker.local wshka-app`

## Rollout And Rollback Assumptions
- Delivery remains single-environment and single-VPS.
- A rollout is expected to update the running app version, then verify `/healthz`.
- Database migrations must run against the same runtime contract and must not rely on hidden local state.
- Rollback is expected to redeploy the previous known-good image tag.
- Backups remain a production requirement before release-impacting database changes.

## Relationship To Later PRs
- `M6-I2` should reuse this env contract when defining the production image runtime surface.
- `M6-I3` should reuse the same ports, runtime variables, and VPS topology for Docker Compose.
- `M6-I4` should reuse the same domain and forwarded-header assumptions for Caddy.
- `M6-I5` should reuse the deploy automation input names and storage expectations.
- `M6-I6` should reuse `/healthz`, rollout, and rollback expectations.
