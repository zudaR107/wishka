# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows SemVer.

## [Unreleased]

### Planned
- Milestone 7: MVP hardening and release prep.

## [0.7.0] - 2026-04-13

### Added
- Runtime environment contract docs for local, CI, and production usage with a
  one-VPS deploy model.
- Production `Next.js standalone` Docker image foundation and container runtime
  surface.
- Production-oriented Docker Compose stack for `app`, `postgres`, and `caddy`
  with persistent storage and explicit service wiring.
- Caddy reverse proxy and automatic HTTPS foundation for `wshka.ru`.
- GHCR image publish workflow for `main` and SemVer tag pushes.
- Release-triggered VPS deploy workflow over SSH with compose rollout,
  production migration step, and `/healthz` verification.
- Delivery validation runbook covering PR validation, image publish, deploy,
  migration verification, failure diagnosis, and rollback shape.

## [0.6.0] - 2026-04-12

### Added
- Reservation schema foundation with first-class `reservations` records and one
  active reservation per wishlist item.
- Reservation lifecycle helpers for active lookup, availability, eligibility,
  creation, and cancellation rules.
- Reservation-aware public wishlist loading by share token with privacy-safe
  item state.
- Public reservation create flow on `/share/[token]` for authenticated
  non-owners with predictable guard behavior for guests, owners, invalid share
  context, and already-reserved items.
- Privacy-safe reserved-status rendering on the owner dashboard `/app`.
- Current-user reservations page on `/app/reservations` with active reservation
  list and cancel flow.
- Reservation coverage across lifecycle helpers, public loading, public reserve
  flow, owner dashboard rendering, and reserver page behavior.

## [0.5.0] - 2026-04-12

### Added
- Share-link schema foundation with first-class `share_links` records and one
  current active link per wishlist.
- Opaque share-token generation and owner-side current share-link helpers.
- Server-rendered owner share-link controls on `/app` with create, revoke, and
  regenerate flows.
- Public wishlist loading by active share token and read-only rendering on
  `/share/[token]`.
- Predictable invalidation behavior for inactive, revoked, and regenerated
  share links.
- Share milestone coverage across token generation, owner lifecycle helpers,
  public loading, and route rendering states.

## [0.4.0] - 2026-04-11

### Added
- Wishlist schema foundation with first-class `wishlists` and `wishlist_items` tables.
- Current owner wishlist bootstrap flow for the single-wishlist UI path.
- Wishlist item data-access helpers for current wishlist and item reads.
- Server-rendered owner dashboard on `/app` with empty state and item list.
- Owner-side wishlist item create, update, and delete flows.
- Wishlist milestone coverage for bootstrap, dashboard rendering, item mutations,
  and owner-scoped behavior.

## [0.3.0] - 2026-04-11

### Added
- Auth schema foundation with `users` and `sessions` tables.
- Password hashing, verification, and email normalization helpers.
- Email registration flow with server-side validation and duplicate email handling.
- Login and logout flow with server-side session creation and removal.
- HTTP-only session cookie handling for auth flow.
- Minimal server-side session guards for `/app` and `/app/reservations`.
- Auth coverage across helpers, flows, guards, and minimal e2e checks.

## [0.2.0] - 2026-04-10

### Added
- Next.js app shell and route skeleton.
- App-level CI baseline with install, typecheck, build, and smoke checks.
- Modular source boundaries for `app`, `modules`, and `shared`.
- PostgreSQL and Drizzle foundation.
- Russian i18n foundation.
- Light theme UI foundation.

## [0.1.0] - 2026-04-10

### Added
- Repository scaffold.
- PR and issue templates.
- Baseline PR validation workflow.
- Minimal documentation foundation.
