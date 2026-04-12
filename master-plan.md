# Wshka Master Plan

## Product
Wshka is a minimal, fast wishlist application with one main social flow:
create a wishlist, share it by link, and let another person reserve an item.

## Product Decisions
- Product name: `Wshka`
- Primary language: Russian first
- Theme strategy: light theme first
- Deployment target: one remote VPS with a domain
- Performance target: fast SSR-first application with minimal client JS
- Architecture target: modular monolith, easy to extend and maintain
- Workflow target: PR-only development, SemVer, Conventional Commits

## Current Status
- Milestone 0 is complete.
- Milestone 1 is complete.
- Milestone 2 is complete.
- Milestone 3 is complete.
- Milestone 4 is complete.
- Milestone 5 is complete.
- Repository, app, DB, i18n, UI, auth, wishlist, share, and reservation
  foundations are in place.
- Next focus: Milestone 6 - Delivery And Ops.

## Scope For `v1.0.0`
Included:
- email/password registration and login
- one wishlist per user in UI
- wishlist item CRUD
- public share link
- item reservation by another authenticated user
- owner sees reservation status without reserver identity
- reserver can cancel their own reservation
- Russian locale
- light theme
- tests, CI, CD, release flow

Excluded:
- images
- dark mode
- English locale
- email verification
- password reset
- multiple wishlists in UI
- notifications
- comments
- tags and categories

## Domain Contract

### Entities
| Entity | Purpose | Contract |
|---|---|---|
| `User` | Account owner or reserver | Unique `email`; password stored only as hash |
| `Session` | Authenticated access | Required for owner actions and reservations |
| `Wishlist` | Container for wishlist items | First-class entity from day one; model allows `many wishlists per user`, but `v1.0.0` allows only one active wishlist in business logic |
| `WishlistItem` | Single wish | Belongs to one `wishlist`; MVP fields: `title`, `url?`, `note?`, `price?` |
| `ShareLink` | Public read-only access | Belongs to one `wishlist`; uses opaque token; can be revoked |
| `Reservation` | Reservation of a wishlist item | At most one active reservation per item; only authenticated non-owner can create it; reserver can cancel their own active reservation |

### Domain Rules
- One wishlist per user in `v1.0.0` is a product rule, not a schema dead end.
- Reservation state should be derived from active reservation records.
- Public visibility is granted only by an active share token.
- Owners can see that an item is reserved, but not who reserved it.
- Guests can view a public wishlist, but cannot reserve items.
- All user-facing text must go through i18n keys.
- All theme values must go through design tokens.

## Access Contract
| Actor | Allowed Actions |
|---|---|
| Guest | View `/`, `/login`, `/register`, valid public share pages |
| Wishlist owner | Manage own wishlist, items, and share link; see reserved state without reserver identity |
| Authenticated non-owner | Reserve items from public share page, view own reservations, cancel own reservations |

## Route Map
| Route | Access | Purpose |
|---|---|---|
| `/` | public | Entry page; authenticated users may later be redirected to `/app` |
| `/login` | public | Login |
| `/register` | public | Registration |
| `/app` | auth | Owner dashboard for the current wishlist |
| `/app/reservations` | auth | List of reservations created by the current user |
| `/share/[token]` | public | Public read-only wishlist page |
| `/healthz` | public-safe | Health endpoint for runtime checks and deploy verification |

Future expansion path:
- multiple wishlists can later introduce `/app/wishlists` and `/app/wishlists/[id]`
- current domain model must not block that path

## Architecture
- Modular monolith
- Server-first rendering
- Minimal client-side state
- Clear module boundaries: `auth`, `wishlist`, `item`, `share`,
  `reservation`, `ui`, `i18n`, `shared`
- PostgreSQL as the primary datastore
- Drizzle for schema and migrations
- Tailwind plus design tokens for UI foundation
- Radix only where accessible interaction primitives are useful

## Repository And Process Rules
- Work only through pull requests into `main`
- Keep PRs small and independently reviewable
- Use Conventional Commits with 50/72 discipline
- Release every milestone with SemVer
- Maintain `CHANGELOG.md`
- Keep architecture and operational docs current as behavior evolves

## Definition Of Done For PR
- The PR solves one focused problem.
- The PR does not include unrelated edits.
- Title and commit subject follow Conventional Commits.
- The change is testable on its own.
- Relevant tests are added or updated.
- If tests are not added, the PR explains why.
- Required CI checks are green.
- Documentation is updated when behavior, env, architecture,
  or delivery process changes.
- DB changes include migrations and rollout notes.
- UI changes include a brief verification note or screenshots.
- No hidden scope creep or unresolved TODOs without follow-up issues.
- Access control and privacy rules remain intact.

## CI Growth Plan

### Early CI Baseline
Introduced across `Milestone 0` and `Milestone 1`.

Checks:
- required repository files are present
- PR title policy for Conventional Commits
- basic markdown and docs validation
- install reproducibility via lockfile-based setup
- typecheck
- build smoke
- minimal unit smoke
- minimal e2e smoke for the app shell

### Feature CI Baseline
Introduced in later product milestones.

Checks:
- all early CI checks
- schema or migration validation
- integration tests for auth, wishlist, share, reservation rules
- route protection checks
- privacy rule checks

### Release And Delivery CI
Introduced in delivery milestones.

Checks:
- all feature CI checks
- container build validation
- Docker Compose validation
- Caddy config validation
- release automation and changelog flow
- image publish
- deploy to protected production environment
- post-deploy health check via `/healthz`

## Deployment Target
- One remote VPS running Ubuntu LTS
- One production environment
- Docker Compose stack: `app`, `postgres`, `caddy`
- `Next.js standalone` production image
- GHCR as image registry
- GitHub Actions for build, publish, and deploy
- Deploy over SSH to the VPS
- Domain terminated by Caddy with automatic HTTPS
- Persistent volumes for PostgreSQL and Caddy data
- Secrets stored in GitHub Environments and on the server, never in git
- Rollback strategy: redeploy previous image tag
- Backups required before public release

## Milestones

### Milestone 0 - Minimal Repo Foundation (`v0.1.0`)
Goal:
- create the minimum repository foundation required for disciplined PR-based work

Status:
- complete

Execution backlog:
1. Minimal repository scaffold
2. PR and issue templates
3. Baseline PR validation
4. Main branch protection

Exit criteria:
- repository foundation exists
- PR templates exist
- baseline CI runs on PRs
- `main` is protected

Release note:
- `v0.1.0` marks the repository foundation milestone.

### Milestone 1 - App Foundation (`v0.2.0`)
Goal:
- establish the application foundation for feature work without architectural churn

Status:
- complete

Execution backlog:
1. Bootstrap app shell and route skeleton
2. App-level CI baseline
3. Module boundaries and import conventions
4. Database foundation
5. Russian i18n foundation
6. Light theme UI foundation

Exit criteria:
- app shell exists
- route skeleton exists
- CI validates application basics
- module structure is stable
- DB foundation exists
- Russian i18n foundation exists
- light theme UI foundation exists

Release note:
- `v0.2.0` marks the application foundation milestone.

### Milestone 2 - Auth Core (`v0.3.0`)
Goal:
- deliver registration, login, logout, and session flow

Status:
- complete

Execution backlog:
1. Auth schema foundation
2. Password hashing and auth helpers
3. Email registration flow
4. Login and logout flow
5. Session guards and route protection
6. Auth test coverage

Recommended issue shape:
- `M2-I1 Auth schema foundation`
- `M2-I2 Password hashing and auth helpers`
- `M2-I3 Email registration flow`
- `M2-I4 Login and logout flow`
- `M2-I5 Session guards and route protection`
- `M2-I6 Auth test coverage`

Recommended PR order:
1. `M2-I1 Auth schema foundation`
2. `M2-I2 Password hashing and auth helpers`
3. `M2-I3 Email registration flow`
4. `M2-I4 Login and logout flow`
5. `M2-I5 Session guards and route protection`
6. `M2-I6 Auth test coverage`

Dependencies:
- `M2-I2` depends on `M2-I1`
- `M2-I3` depends on `M2-I1` and `M2-I2`
- `M2-I4` depends on `M2-I1` and `M2-I2`
- `M2-I5` depends on `M2-I4`
- `M2-I6` depends on `M2-I3`, `M2-I4`, and `M2-I5`

Scope notes:
- Use `users` and `sessions` as the first auth tables.
- Keep auth flow email/password only in `v0.3.0`.
- Do not add email verification or password reset in this milestone.
- Keep route protection minimal: enough for `/app` and `/app/reservations`.
- Prefer HTTP-only secure session cookies over client-managed auth state.

Acceptance targets:
- user can register with email and password
- user can log in and log out
- protected routes reject unauthenticated access
- auth foundation lives inside the agreed module boundaries
- auth flow is covered by unit, integration, and minimal e2e tests

Exit criteria:
- `users` and `sessions` schema exist
- password hashing and comparison utilities exist
- registration flow works
- login and logout flow work
- protected route checks exist for owner-area routes
- auth CI coverage is in place for the core happy path and guard cases

Definition of small PRs for this milestone:
- schema PR only adds DB structures and related docs
- helper PR only adds reusable auth utilities
- flow PRs add one user-facing auth capability at a time
- guard PR only adds route/session protection behavior
- test PR expands coverage without mixing new auth behavior

Release note:
- `v0.3.0` marks the authentication foundation milestone.

### Milestone 3 - Wishlist Core (`v0.4.0`)
Goal:
- deliver the owner wishlist and item CRUD

Status:
- complete

Execution backlog:
1. Wishlist schema foundation
2. Owner wishlist bootstrap flow
3. Wishlist item schema and data access foundation
4. Owner dashboard data loading
5. Wishlist item create flow
6. Wishlist item update and delete flow
7. Wishlist core test coverage

Recommended issue shape:
- `M3-I1 Wishlist schema foundation`
- `M3-I2 Owner wishlist bootstrap flow`
- `M3-I3 Wishlist item schema and data access foundation`
- `M3-I4 Owner dashboard data loading`
- `M3-I5 Wishlist item create flow`
- `M3-I6 Wishlist item update and delete flow`
- `M3-I7 Wishlist core test coverage`

Recommended PR order:
1. `M3-I1 Wishlist schema foundation`
2. `M3-I2 Owner wishlist bootstrap flow`
3. `M3-I3 Wishlist item schema and data access foundation`
4. `M3-I4 Owner dashboard data loading`
5. `M3-I5 Wishlist item create flow`
6. `M3-I6 Wishlist item update and delete flow`
7. `M3-I7 Wishlist core test coverage`

Dependencies:
- `M3-I2` depends on `M2-I5`
- `M3-I3` depends on `M3-I1`
- `M3-I4` depends on `M3-I1`, `M3-I2`, and `M3-I3`
- `M3-I5` depends on `M3-I3` and `M3-I4`
- `M3-I6` depends on `M3-I3`, `M3-I4`, and `M3-I5`
- `M3-I7` depends on `M3-I4`, `M3-I5`, and `M3-I6`

Scope notes:
- Treat `wishlists` as a first-class table even though `v1.0.0` UI exposes one
  active wishlist per owner.
- The owner dashboard at `/app` should become the first real wishlist screen.
- Keep item fields minimal for this milestone: `title`, `url?`, `note?`, `price?`.
- Use the existing authenticated session guard foundation; do not expand into
  share or reservation behavior yet.
- Prefer server actions and server-rendered data loading over client state.

Acceptance targets:
- authenticated owner sees their current wishlist on `/app`
- if the owner has no wishlist yet, the app creates or bootstraps the single
  active wishlist needed for `v1.0.0`
- owner can create wishlist items
- owner can update and delete wishlist items
- wishlist UI and behavior stay inside the agreed module boundaries
- wishlist core is covered by focused tests for data rules and owner flows

Exit criteria:
- `wishlists` and `wishlist_items` schema exist
- authenticated owner can load their current wishlist on `/app`
- owner can create an item
- owner can edit an item
- owner can delete an item
- one active wishlist per user is enforced in business logic for the current UI
- wishlist core coverage exists for owner happy path and key validation cases

Definition of small PRs for this milestone:
- schema PR only adds wishlist tables, relations, migrations, and docs
- bootstrap PR only establishes the single-owner wishlist creation/loading path
- data-loading PR only wires owner dashboard reads
- create PR only adds item creation behavior and its UI
- update/delete PR only adds item editing and removal behavior
- test PR expands coverage without mixing in new wishlist behavior

Release note:
- `v0.4.0` marks the owner wishlist milestone.

### Milestone 4 - Share Links (`v0.5.0`)
Goal:
- deliver secure public read-only sharing by token

Status:
- complete

Execution backlog:
1. Share link schema foundation
2. Share token and owner share helpers
3. Owner dashboard share link controls
4. Public wishlist loading by share token
5. Public share route rendering
6. Share link revocation and regeneration flow
7. Share link test coverage

Recommended issue shape:
- `M4-I1 Share link schema foundation`
- `M4-I2 Share token and owner share helpers`
- `M4-I3 Owner dashboard share link controls`
- `M4-I4 Public wishlist loading by share token`
- `M4-I5 Public share route rendering`
- `M4-I6 Share link revocation and regeneration flow`
- `M4-I7 Share link test coverage`

Recommended PR order:
1. `M4-I1 Share link schema foundation`
2. `M4-I2 Share token and owner share helpers`
3. `M4-I3 Owner dashboard share link controls`
4. `M4-I4 Public wishlist loading by share token`
5. `M4-I5 Public share route rendering`
6. `M4-I6 Share link revocation and regeneration flow`
7. `M4-I7 Share link test coverage`

Dependencies:
- `M4-I2` depends on `M4-I1`
- `M4-I3` depends on `M4-I2` and `M3-I4`
- `M4-I4` depends on `M4-I1`, `M4-I2`, and `M3-I3`
- `M4-I5` depends on `M4-I4`
- `M4-I6` depends on `M4-I2` and `M4-I3`
- `M4-I7` depends on `M4-I3`, `M4-I4`, `M4-I5`, and `M4-I6`

Scope notes:
- Public access must be granted only by opaque active share tokens.
- Keep the share route read-only in this milestone; reservations come later.
- Prefer one current active share link in the owner UI without blocking archived
  or regenerated links in the schema.
- Reuse the current wishlist and item read foundation instead of duplicating
  public loading logic in routes.
- Do not expose owner-only controls on the public share page.

Acceptance targets:
- authenticated owner can obtain a shareable public link for the current
  wishlist
- valid share token loads a public read-only wishlist page with items
- invalid or inactive share token is rejected predictably
- public share access works without authentication
- share flow is covered by focused tests for owner and public paths

Exit criteria:
- share-link schema exists
- owner can create or access the current public share link for the current
  wishlist
- owner can revoke or regenerate a share link
- `/share/[token]` renders a public read-only wishlist with items
- invalid or inactive share tokens do not expose wishlist data
- share coverage exists for owner management and public access happy/guard cases

Definition of small PRs for this milestone:
- schema PR only adds share tables, relations, migrations, and docs
- helper PR only adds token generation and owner share lookup logic
- dashboard-controls PR only adds owner share actions and UI entry points
- public-loading PR only wires share-token data reads
- route-render PR only renders the public read-only page
- revoke-regenerate PR only adds share lifecycle behavior
- test PR expands coverage without mixing in reservation behavior

Release note:
- `v0.5.0` marks the public sharing milestone.

### Milestone 5 - Reservations (`v0.6.0`)
Goal:
- deliver reservation flow, cancellation, and privacy rules

Status:
- complete

Execution backlog:
1. Reservation schema foundation
2. Reservation helpers and lifecycle rules
3. Public wishlist reservation state loading
4. Public reservation create flow
5. Owner dashboard reserved-status rendering
6. Reserver reservations page and cancel flow
7. Reservation test coverage

Recommended issue shape:
- `M5-I1 Reservation schema foundation`
- `M5-I2 Reservation helpers and lifecycle rules`
- `M5-I3 Public wishlist reservation state loading`
- `M5-I4 Public reservation create flow`
- `M5-I5 Owner dashboard reserved-status rendering`
- `M5-I6 Reserver reservations page and cancel flow`
- `M5-I7 Reservation test coverage`

Recommended PR order:
1. `M5-I1 Reservation schema foundation`
2. `M5-I2 Reservation helpers and lifecycle rules`
3. `M5-I3 Public wishlist reservation state loading`
4. `M5-I4 Public reservation create flow`
5. `M5-I5 Owner dashboard reserved-status rendering`
6. `M5-I6 Reserver reservations page and cancel flow`
7. `M5-I7 Reservation test coverage`

Dependencies:
- `M5-I2` depends on `M5-I1`
- `M5-I3` depends on `M5-I1`, `M4-I4`, and `M3-I3`
- `M5-I4` depends on `M5-I2`, `M5-I3`, and `M4-I5`
- `M5-I5` depends on `M5-I1`, `M5-I2`, and `M3-I4`
- `M5-I6` depends on `M5-I2` and `M2-I5`
- `M5-I7` depends on `M5-I4`, `M5-I5`, and `M5-I6`

Scope notes:
- Reservation state must be derived from active reservation records instead of
  denormalized item flags.
- Only authenticated non-owners can reserve items from public share pages.
- Guests may still view public wishlists, but they must not be able to reserve.
- Owners must see reserved status without seeing reserver identity.
- Keep cancel behavior scoped to the authenticated reserver's own active
  reservations.
- Reuse the share and wishlist read foundations instead of duplicating route
  queries for reservation-aware views.

Acceptance targets:
- authenticated non-owner can reserve an available item from a public share page
- guest can view the public page but cannot reserve items
- owner cannot reserve their own wishlist items
- owner dashboard shows privacy-safe reserved status for items
- reserver can view and cancel their own active reservations on
  `/app/reservations`
- reservation rules are covered by focused tests for owner, reserver, and guard
  cases

Exit criteria:
- reservation schema exists
- at most one active reservation can exist per item
- public share page can create reservations for eligible authenticated
  non-owners
- owner dashboard shows reserved state without exposing reserver identity
- `/app/reservations` lists the current user's reservations and supports
  cancellation
- canceled or superseded reservations no longer count as active
- reservation coverage exists for rule enforcement and key UI states

Definition of small PRs for this milestone:
- schema PR only adds reservation tables, constraints, migrations, and docs
- helper PR only adds reusable reservation lifecycle and eligibility helpers
- public-loading PR only wires reservation-aware public read state
- create-flow PR only adds public reservation behavior and guard feedback
- owner-status PR only adds privacy-safe owner dashboard state
- reservations-page PR only adds current-user reservation reads and cancel flow
- test PR expands coverage without mixing in delivery or notification work

Release note:
- `v0.6.0` marks the reservation flow milestone.

### Milestone 6 - Delivery And Ops (`v0.7.0`)
Goal:
- deliver deploy-ready infrastructure, CI/CD, and release automation

Status:
- planned

Execution backlog:
1. Runtime environment contract and deploy docs foundation
2. Production container image foundation
3. Docker Compose production stack
4. Caddy reverse proxy and HTTPS foundation
5. GitHub Actions build, release, and image publish pipeline
6. VPS deploy workflow and health-check flow
7. Delivery and ops validation coverage

Recommended issue shape:
- `M6-I1 Runtime environment contract and deploy docs foundation`
- `M6-I2 Production container image foundation`
- `M6-I3 Docker Compose production stack`
- `M6-I4 Caddy reverse proxy and HTTPS foundation`
- `M6-I5 GitHub Actions build, release, and image publish pipeline`
- `M6-I6 VPS deploy workflow and health-check flow`
- `M6-I7 Delivery and ops validation coverage`

Recommended PR order:
1. `M6-I1 Runtime environment contract and deploy docs foundation`
2. `M6-I2 Production container image foundation`
3. `M6-I3 Docker Compose production stack`
4. `M6-I4 Caddy reverse proxy and HTTPS foundation`
5. `M6-I5 GitHub Actions build, release, and image publish pipeline`
6. `M6-I6 VPS deploy workflow and health-check flow`
7. `M6-I7 Delivery and ops validation coverage`

Dependencies:
- `M6-I2` depends on `M6-I1`
- `M6-I3` depends on `M6-I1` and `M6-I2`
- `M6-I4` depends on `M6-I3`
- `M6-I5` depends on `M6-I2`
- `M6-I6` depends on `M6-I3`, `M6-I4`, and `M6-I5`
- `M6-I7` depends on `M6-I2`, `M6-I3`, `M6-I4`, `M6-I5`, and `M6-I6`

Scope notes:
- Keep the deployment target limited to one VPS with one production
  environment.
- Build around the current application behavior; Milestone 6 should not add new
  wishlist, share, or reservation product features.
- Prefer `Next.js standalone` images and a minimal runtime surface.
- Keep operational configuration explicit: env contract, secrets handling,
  ports, volumes, and health checks should be documented and reviewable.
- Use GHCR and GitHub Actions for image publishing and deployment automation.
- Production rollout must verify `/healthz` after deploy.

Acceptance targets:
- the repository documents the runtime env contract for local, CI, and
  production deployment
- a production image can be built consistently from the current app
- a Docker Compose stack can run `app`, `postgres`, and `caddy` together
- Caddy can front the app with the expected production routing and HTTPS setup
- GitHub Actions can build, version, and publish the app image
- deploy automation can roll out the current release to the VPS and confirm
  health via `/healthz`
- delivery and ops behavior is covered by focused validation checks and docs

Exit criteria:
- runtime env contract and deployment docs exist
- production Docker image build exists
- production Docker Compose stack exists
- Caddy production config exists
- GitHub Actions release and image publish workflow exists
- protected VPS deploy workflow exists
- post-deploy health verification exists
- delivery validation coverage exists for the happy path and key failure guards

Definition of small PRs for this milestone:
- env-contract PR only adds deploy env docs, templates, and rollout notes
- container PR only adds production image build logic
- compose PR only adds orchestration for `app`, `postgres`, and `caddy`
- caddy PR only adds reverse proxy and HTTPS config
- ci-publish PR only adds build, release, and GHCR publish automation
- deploy PR only adds VPS rollout and health-check behavior
- validation PR expands delivery checks and docs without mixing in product work

Release note:
- `v0.7.0` marks the delivery and operations milestone.

### Milestone 7 - MVP Hardening (`v1.0.0`)
Goal:
- harden the product, complete core end-to-end coverage, and ship `v1.0.0`

## GitHub Project Shape
Recommended item types:
- milestone tracking items
- execution issues
- ops tasks
- release items

Recommended project fields:
- `Type`
- `Milestone`
- `Status`
- `Priority`
- `Depends on`
- `Version target`
- `PR`

Recommended planning rule:
- one issue should usually map to one small PR
- a milestone should have one tracking item and one release item

## Post-MVP Direction
- `v1.1.0`: multiple wishlists in UI and routes
- `v1.2.0`: item images
- `v1.3.0`: English locale
- `v1.4.0`: dark theme
- `v1.5.0`: email verification and password reset
- `v1.6.0`: api documentation (swagger / openapi)
