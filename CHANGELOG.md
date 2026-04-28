# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows SemVer.

## [Unreleased]

## [1.1.0] - 2026-04-28

### Added
- Self-reservation: owners can reserve and cancel their own items from the
  dashboard and the share page; self-reserved items are visually distinct.
- Item starring: star toggle marks favourite items; starred items sort to the
  top on the dashboard and share page, with a read-only star badge for
  gift-givers. Star can also be set at creation time via the create-item form.
- Account settings page (`/settings`): email display and «О себе» bio
  textarea; bio is shown on the share page to authenticated visitors.
- Header account menu: gear icon with account email, Settings link, and
  logout; replaces the standalone logout button. Owner email is also shown
  in the share page title area for all visitors.
- Multiple wishlists: owners can create, rename, and delete named wishlists;
  a dropdown selector switches between them instantly with no page reload.
  Each wishlist has an independent share link; the last wishlist cannot be
  deleted. A default «Мой список» is created automatically on registration.
- Brand label "WSHKA" added above the page title on all content pages.
- Price input field shows live formatting while typing: thousands are
  separated by a non-breaking space and the currency symbol (₽) appears
  inline right after the digits (e.g. `3 490 ₽`). The server strips
  formatting before parsing so existing validation is unaffected.
- Item create and edit forms auto-collapse on success; the page scrolls to
  the action buttons row. On create, scroll targets the newly added card
  regardless of its position (starred items land at the top, unstarred at
  the bottom).
- Deleting an item removes it from the list immediately without a background
  refresh, so the decorative background stays stable.

### Fixed
- Share page item cards now match the dashboard layout: colored status strip,
  unified card body, and consistent button style.
- Reservation on the share page no longer causes a full-page reload; the
  result is shown inline via `useActionState` + `router.refresh()`.
- After logging in from a share page, users are redirected back to the share
  page they came from. The login link passes `?next=/share/<token>` and
  `loginAction` honours it.
- Cancelling a reservation on `/reservations` no longer causes a full-page
  reload; the card disappears inline.
- Confirmation dialogs have side margins on narrow viewports via
  `min(24rem, calc(100% - 2 * var(--space-4)))`.
- Opening the item edit form scrolls to the action buttons row (Edit /
  Reserve / Delete) without triggering auto-focus, so the browser chrome
  stays visible on mobile.
- Share page title changed from "Публичный вишлист" to "Вишлист"; the list
  is link-shared, not openly public.
- `/settings` added to `robots.txt` Disallow and gets `noindex` meta tag.
  Auth pages (`/login`, `/register`, `/reservations`) removed from
  `robots.txt` Disallow so Googlebot can crawl them and honour their
  existing `noindex` meta tags.

## [1.0.1] - 2026-04-23

### Added
- Technical SEO baseline: page-level `<title>` and `<meta description>` for
  all routes; `robots.txt` with noindex for auth and private pages; `sitemap.xml`
  covering public routes; branded OG image (1200 × 630) via `next/og`.
- JSON-LD `WebApplication` structured-data script on the landing page.
- Dynamic share-page metadata: page title and description reflect the wishlist
  item count with correct Russian pluralization; always noindexed.
- App favicons: `icon.png` (32 × 32) and `apple-icon.png` (180 × 180)
  converted from the existing `icon.svg`.
- Unit tests for `formatPrice`: seven cases covering thousands separators,
  rounding, and zero.
- Unit tests for wishlist item validation: URL-without-protocol normalisation,
  `MAX_PRICE` boundary acceptance and rejection, zero price acceptance.
- Unit test for JSON-LD rendering on the unauthenticated landing page.

### Changed
- Owner dashboard, create-item form, delete-item button, and regenerate-link
  button now use `useActionState` + `startTransition(() => router.refresh())`
  instead of redirect-based status URLs, eliminating full-page reloads after
  mutations.
- Edit-item form uses `formRef` + `form.reset()` (driven by `updatedAt` change
  after RSC refresh) instead of key-based DOM re-mount; prevents stale field
  values and flicker after save.
- Inline success/error notifications scroll into view on success via
  `scrollIntoView({ behavior: "smooth", block: "start" })`.
- Dashboard component files grouped into `src/app/_dashboard/` using Next.js
  private-folder convention; no routing changes.
- Deleted empty barrel files `src/modules/item/` and `src/modules/ui/`
  (contained only `export {}`).

### Fixed
- Edited note reverted to old text after save when RSC refreshed before the
  form re-mounted with new data.
- UI flicker on item create / delete / regenerate-link caused by unguarded
  `router.refresh()` calls outside `startTransition`.
- E2e tests updated to match inline-state flow: removed assertions for
  `?status=item-created` / `?status=item-updated` query parameters that no
  longer exist after the redirect removal.

## [1.0.0] - 2026-04-15

### Added
- Full UI redesign: global header and footer with navigation, sticky layout,
  design token system, wallpaper background.
- Owner dashboard redesigned with compact item cards, inline edit via
  `<details>/<summary>`, and share link block.
- Home page redesigned with hero section, features section, and dev-only
  navigation block.
- Auth pages redesigned with centered card layout.
- Public share page redesigned with compact item cards and reservation flow.
- Reservations page redesigned with compact cards and cancel flow.
- `/roadmap` page with vertical timeline and milestone status indicators.
- `/not-found` (404) styled page.
- `/privacy` and `/terms` static legal pages.
- Auto-login after successful registration — session created immediately,
  no separate login step required.
- Logout redirects to home page instead of login page.
- Price display with Ruble symbol (₽) and per-line layout for price and URL.
- GitHub repository link in footer; version badge links to `/roadmap`.
- Project structure reorganized: tool configs moved to `config/`, docs to
  `docs/`, Dockerfile moved to `ops/`.

### Changed
- Owner dashboard and reservations page moved from `/app` and
  `/app/reservations` to `/` and `/reservations`.
- `RegisterUserResult` success now includes `userId` for auto-login.
- Logout action redirects to `/` instead of `/login?status=logged-out`.
- `npm run dev` clears `.next` before starting to prevent conflicts with
  production build artifacts.
- `compose.yaml` updated to reference `ops/Dockerfile`.
- `tsconfig.json` excludes `config/` directory instead of individual root files.

### Fixed
- Drizzle config paths resolve correctly relative to CWD when config is in
  `config/` subdirectory.
- E2e logout test waits for guest state before checking protected route
  redirect, removing a race condition.

## [0.7.0] - 2026-04-13

### Added
- Runtime environment contract docs for local, CI, and production usage.
- Production `Next.js standalone` Docker image.
- Production-oriented Docker Compose stack for `app`, `postgres`, and `caddy`.
- Caddy reverse proxy and automatic HTTPS for `wshka.ru`.
- GHCR image publish workflow for `main` and SemVer tag pushes.
- Release-triggered VPS deploy over SSH with migrations and `/healthz` check.
- Delivery validation runbook covering PR validation, image publish, deploy,
  migration verification, failure diagnosis, and rollback.

## [0.6.0] - 2026-04-12

### Added
- Reservation schema with one active reservation per item.
- Reservation lifecycle helpers: active lookup, availability, eligibility,
  creation, and cancellation rules.
- Reservation-aware public wishlist loading with privacy-safe item state.
- Public reservation create flow on `/share/[token]` for authenticated
  non-owners.
- Privacy-safe reserved-status rendering on the owner dashboard.
- Current-user reservations page with active list and cancel flow.
- Reservation coverage across lifecycle helpers and owner/public/reserver routes.

## [0.5.0] - 2026-04-12

### Added
- Share-link schema with one current active link per wishlist.
- Opaque share-token generation and owner-side helpers.
- Owner share-link controls: create, revoke, regenerate.
- Public wishlist loading by active share token on `/share/[token]`.
- Predictable invalidation for inactive, revoked, and regenerated share links.
- Share coverage across token generation, owner lifecycle, public loading.

## [0.4.0] - 2026-04-11

### Added
- Wishlist schema with `wishlists` and `wishlist_items` tables.
- Owner wishlist bootstrap for the single-wishlist UI path.
- Server-rendered owner dashboard with empty state and item list.
- Owner-side item create, update, and delete flows.
- Wishlist coverage for bootstrap, dashboard rendering, and item mutations.

## [0.3.0] - 2026-04-11

### Added
- Auth schema with `users` and `sessions` tables.
- Password hashing, verification, and email normalization helpers.
- Email registration flow with validation and duplicate email handling.
- Login and logout with server-side session creation and removal.
- HTTP-only session cookie handling.
- Server-side session guards for authenticated routes.
- Auth coverage across helpers, flows, guards, and e2e checks.

## [0.2.0] - 2026-04-10

### Added
- Next.js app shell and route skeleton.
- App-level CI baseline: install, typecheck, build, smoke checks.
- Modular source structure for `app`, `modules`, and `shared`.
- PostgreSQL and Drizzle foundation.
- Russian i18n foundation.
- Light theme UI foundation.

## [0.1.0] - 2026-04-10

### Added
- Repository scaffold with PR and issue templates.
- Baseline PR validation workflow.
- Minimal documentation foundation.
