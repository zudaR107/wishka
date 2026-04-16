# Delivery Validation Runbook

## Scope
- This document is the current validation runbook for the delivery flow.
- It describes how to validate the path from PR to production health check.
- It reuses the runtime, image, compose, publish, and deploy foundations that are now part of the current project baseline.

## Delivery Flow
1. Open a PR to `main`.
2. Let PR validation pass.
3. Merge to `main`.
4. Let the image publish workflow push the production image to GHCR.
5. Push a SemVer tag and publish the matching GitHub Release.
6. Let the production deploy workflow roll out the published image, apply migrations, and verify `/healthz`.

## Source Of Truth By Stage

### PR Validation
- Workflow: `.github/workflows/baseline-pr-validation.yml`
- Source-of-truth checks:
  - `npm ci`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:unit`
  - `npm run test:e2e`
- The `e2e` job provisions PostgreSQL in GitHub Actions and runs `npm run db:migrate` before Playwright.
- A PR is not delivery-ready until this workflow is green.

### Image Publish
- Workflow: `.github/workflows/image-publish.yml`
- Trigger:
  - push to `main`
  - push of `v*.*.*` tags
- Source-of-truth image build path:
  - `ops/Dockerfile`
- Expected GHCR tags:
  - every publish run: `sha-<full-commit-sha>`
  - default branch publish: `main`
  - SemVer tag publish: `vX.Y.Z`, `X.Y`, `X`, `latest`

### Production Deploy
- Workflow: `.github/workflows/production-deploy.yml`
- Trigger:
  - GitHub Release `published`
- Deploy target:
  - the already-published GHCR image matching the GitHub Release tag
- Source-of-truth remote rollout path:
  - `ops/deploy/remote-deploy.sh`

## Validation Checklist By Stage

### 1. Build And CI Validation
How to validate locally before or after PR:
```bash
npm ci
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e
```

How to validate on GitHub:
1. Open the PR.
2. Check the `PR Validation` workflow.
3. Confirm all jobs are green.

If this stage fails:
- inspect the failed GitHub Actions job log first
- rerun the matching local command from the list above

### 2. Image Publish Validation
How to validate on GitHub:
1. Open `Actions`.
2. Check the `Image Publish` workflow run for the relevant `main` push or SemVer tag push.
3. Confirm the `docker-publish` job succeeded.

How to validate in GHCR:
1. Open the package for the configured `GHCR_IMAGE`.
2. Confirm the expected tag exists.
3. Use the tag that matches the delivery stage:
   - `main` for latest default-branch build
   - `sha-...` for immutable commit-specific lookup
   - `vX.Y.Z` for release deploy and rollback

What success looks like:
- the package exists in GHCR
- the expected tag is present
- the publish workflow did not rebuild through any path other than the repository `Dockerfile`

### 3. Deploy Validation On VPS
How deploy is triggered:
1. Push a SemVer tag.
2. Let `Image Publish` finish for that tag.
3. Publish the matching GitHub Release.

How to validate on GitHub:
1. Open `Actions`.
2. Check the `Production Deploy` workflow run.
3. Confirm these stages succeed:
   - SSH setup
   - deploy artifact upload
   - remote rollout
   - production health verification

What the server does during rollout:
1. validates `docker compose` config
2. starts `postgres`
3. waits for `postgres` health
4. pulls the target `app` image tag
5. runs migrations
6. recreates `app` and `caddy`
7. prints `docker compose ps`

What success looks like:
- the deploy workflow is green
- the remote rollout step does not fail
- the external health check step succeeds

### 4. Migration Validation
Migration command used by deploy:
```bash
docker compose --env-file .env.compose.production run --rm --no-deps app node /app/ops/deploy/run-migrations.mjs
```

How to validate migrations applied:
1. Confirm the deploy workflow did not fail in the migration phase.
2. If needed, rerun the same command manually on the VPS.
3. The command must exit successfully before the updated app is started.

Manual VPS verification:
```bash
cd "$PRODUCTION_APP_DIR"
docker compose --env-file .env.compose.production run --rm --no-deps app node /app/ops/deploy/run-migrations.mjs
```

What success looks like:
- the migration command exits with code `0`
- rerunning it is safe and does not require schema rollback first

### 5. Runtime And Health Validation
Public verification endpoint:
```bash
curl -f https://wshka.ru/healthz
```

Expected response:
```json
{"status":"ok"}
```

What this validates:
- public DNS and ingress reach the VPS
- Caddy serves the public entrypoint
- Caddy can proxy to the app
- the app is up after deploy

### 6. Failure Diagnosis
Primary places to check:
1. GitHub Actions logs
2. VPS `docker compose ps`
3. VPS `docker compose logs`

Useful VPS commands:
```bash
cd "$PRODUCTION_APP_DIR"
docker compose --env-file .env.compose.production ps
docker compose --env-file .env.compose.production logs --no-color --tail=100 postgres app caddy
```

How to interpret common failures:
- PR validation failed:
  - the code or docs do not satisfy the repository validation gates
- image publish failed:
  - inspect GHCR auth, tag metadata, and Docker build logs
- deploy failed before migration:
  - inspect SSH connectivity, remote file upload, and VPS Docker/Compose availability
- migration step failed:
  - inspect database connectivity, `POSTGRES_*` values, and migration runner logs
- health check failed after rollout:
  - inspect `caddy` and `app` logs first, then verify `https://wshka.ru/healthz` manually

## Rollback
Rollback stays manual but explicit.

### Rollback Goal
- redeploy the previous known-good immutable image tag
- reuse the same compose and migration-aware rollout path
- do not rebuild on the VPS

### Rollback Steps
1. Identify the previous known-good GHCR tag.
2. SSH to the VPS.
3. Go to the deploy directory.
4. Create a temporary `.deploy.env` with the older image tag.
5. Run `./ops/deploy/remote-deploy.sh`.
6. Recheck `https://wshka.ru/healthz`.

Example rollback shape:
```bash
cd "$PRODUCTION_APP_DIR"
cat > .deploy.env <<'EOF'
APP_IMAGE=ghcr.io/<owner>/wshka-app:vX.Y.Z
GHCR_USERNAME=<owner>
GHCR_TOKEN=<read-token>
EOF
./ops/deploy/remote-deploy.sh
curl -f https://wshka.ru/healthz
```

Notes:
- use an immutable release tag or `sha-...` tag, not a moving tag like `main`
- `remote-deploy.sh` removes the temporary `.deploy.env` on exit

## Required Inputs And Files
- Runtime and deploy contract: `docs/runtime-environment.md`
- Production runtime file on VPS: `.env.compose.production`
- Compose stack: `compose.yaml`
- Caddy config: `ops/caddy/Caddyfile`
- Deploy script: `ops/deploy/remote-deploy.sh`
- Migration runner: `ops/deploy/run-migrations.mjs`
- PR validation workflow: `.github/workflows/baseline-pr-validation.yml`
- Image publish workflow: `.github/workflows/image-publish.yml`
- Production deploy workflow: `.github/workflows/production-deploy.yml`

## Minimal Operator Checklist
1. PR validation is green.
2. The expected GHCR image tag exists.
3. The GitHub Release tag matches the intended deploy tag.
4. The deploy workflow is green.
5. The migration step did not fail.
6. `https://wshka.ru/healthz` returns `200` with `{"status":"ok"}`.
7. If deploy fails, inspect GitHub Actions first, then VPS `docker compose ps` and `logs`.
