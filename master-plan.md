# Wishka Master Plan

## Product
Wishka is a minimal, fast wishlist application with one main social flow:
create a wishlist, share it by link, and let another person reserve an item.

## Product Decisions
- Product name: `Wishka`
- Primary language: Russian first
- Theme strategy: light theme first
- Deployment target: one remote VPS with a domain
- Performance target: fast SSR-first application with minimal client JS
- Architecture target: modular monolith, easy to extend and maintain
- Workflow target: PR-only development, SemVer, Conventional Commits

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

### Milestone 1 - App Foundation (`v0.2.0`)
Goal:
- establish the application foundation for feature work without architectural churn

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

### Milestone 2 - Auth Core (`v0.3.0`)
Goal:
- deliver registration, login, logout, and session flow

### Milestone 3 - Wishlist Core (`v0.4.0`)
Goal:
- deliver the owner wishlist and item CRUD

### Milestone 4 - Share Links (`v0.5.0`)
Goal:
- deliver secure public read-only sharing by token

### Milestone 5 - Reservations (`v0.6.0`)
Goal:
- deliver reservation flow, cancellation, and privacy rules

### Milestone 6 - Delivery And Ops (`v0.7.0`)
Goal:
- deliver deploy-ready infrastructure, CI/CD, and release automation

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
