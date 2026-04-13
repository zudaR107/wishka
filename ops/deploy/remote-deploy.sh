#!/usr/bin/env bash

set -euo pipefail

: "${PWD:?working directory is required}"

if [[ ! -f .env.compose.production ]]; then
  echo "Missing .env.compose.production in $(pwd)"
  exit 1
fi

if [[ ! -f .deploy.env ]]; then
  echo "Missing .deploy.env in $(pwd)"
  exit 1
fi

set -a
. ./.deploy.env
set +a

: "${APP_IMAGE:?APP_IMAGE is required}"
: "${GHCR_USERNAME:?GHCR_USERNAME is required}"
: "${GHCR_TOKEN:?GHCR_TOKEN is required}"

wait_for_service_health() {
  local service="$1"
  local container_id=""
  local status=""

  for _ in $(seq 1 30); do
    container_id="$(docker compose --env-file .env.compose.production ps -q "$service")"

    if [[ -n "$container_id" ]]; then
      status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || true)"

      if [[ "$status" == "healthy" ]]; then
        return 0
      fi
    fi

    sleep 2
  done

  echo "Timed out waiting for $service to become healthy"
  return 1
}

cleanup() {
  rm -f ./.deploy.env

  if [[ -n "${DOCKER_CONFIG:-}" && -d "${DOCKER_CONFIG}" ]]; then
    rm -rf "${DOCKER_CONFIG}"
  fi
}

trap cleanup EXIT

DOCKER_CONFIG="$(mktemp -d)"
export DOCKER_CONFIG

printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

export APP_IMAGE

docker compose --env-file .env.compose.production config >/dev/null
docker compose --env-file .env.compose.production up -d postgres
wait_for_service_health postgres
docker compose --env-file .env.compose.production pull app
docker compose --env-file .env.compose.production run --rm --no-deps app \
  node /app/ops/deploy/run-migrations.mjs
docker compose --env-file .env.compose.production up -d --no-build --force-recreate app caddy
docker compose --env-file .env.compose.production ps
