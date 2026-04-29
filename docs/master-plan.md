# Wshka Master Plan

## Product
Wshka is a minimal, fast wishlist app with one core social flow:
create a wishlist → share it by link → let another person reserve a gift.

## Product Decisions
- Product name: `Wshka`
- Primary language: Russian first
- Theme strategy: light theme first
- Deployment target: one remote VPS with a domain
- Performance target: fast SSR-first with minimal client JS
- Architecture: modular monolith, easy to extend
- Workflow: PR-only, SemVer, Conventional Commits
- Must not become a social network

## Domain Contract

### Entities
| Entity | Purpose | Contract |
|---|---|---|
| `User` | Account owner or reserver | Unique `email`; password stored only as hash |
| `Session` | Authenticated access | Required for owner actions and reservations |
| `Wishlist` | Container for items | Schema and UI support many per user; default created on registration |
| `WishlistItem` | Single wish | Fields: `title`, `url?`, `note?`, `price?` |
| `ShareLink` | Public read-only access | Opaque token; one active per wishlist; revocable |
| `Reservation` | Item reservation | At most one active per item |

### Domain Rules
- Reservation state is derived from active records, not denormalized flags.
- Public access requires an active share token.
- Owners see reserved status but never reserver identity.
- All text goes through i18n keys. All theme values go through design tokens.

## Access Contract
| Actor | Allowed Actions |
|---|---|
| Guest | View `/`, `/login`, `/register`, valid public share pages |
| Owner | Manage wishlist, items, share link; see reserved state |
| Authenticated non-owner | Reserve items via share page, view and cancel own reservations |

## Route Map
| Route | Access | Purpose |
|---|---|---|
| `/` | public + auth | Landing page (guest) / owner dashboard (authenticated) |
| `/login` | public | Login |
| `/register` | public | Registration |
| `/reservations` | auth | Current user's reservations |
| `/settings` | auth | Account settings (email, bio) |
| `/share/[token]` | public | Public read-only wishlist |
| `/roadmap` | public | Product roadmap |
| `/privacy` | public | Privacy policy |
| `/terms` | public | Terms of use |
| `/healthz` | public-safe | Health check for deploy verification |

## Architecture
- Modular monolith, server-first rendering, minimal client state
- Module boundaries: `auth`, `wishlist`, `item`, `share`, `reservation`, `ui`, `i18n`, `shared`
- PostgreSQL + Drizzle, Tailwind + design tokens

## Process Rules
- Work through PRs only; `main` is protected
- Conventional Commits with 50/72 discipline
- SemVer releases, maintained `CHANGELOG.md`
- Docs updated when behavior, env, or delivery process changes

## Definition Of Done
- Single focused change, relevant tests updated, CI green
- No unrelated edits, no hidden scope creep
- Docs updated when behavior or delivery process changes
- DB changes include migrations; UI changes include verification note

---

## Milestones

### Shipped

| Version | Milestone | Status |
|---|---|---|
| v0.1.0–v0.7.0 | M0–M6: Repo scaffold, auth, wishlist CRUD, share links, reservations, Docker/CI/CD/VPS | ✅ shipped |
| v1.0.0 | M7–M8: UI redesign, auto-login, /app→/ routing merge, legal pages, project restructure | ✅ shipped |
| v1.0.1 | Patch: inline mutation state (no redirect), UX fixes, technical SEO, dashboard refactor, test coverage | ✅ shipped |
| v1.1.0 | M9: self-reservation, item starring, owner bio, multiple wishlists, UX bugfix batch | ✅ shipped |

---

### Milestone 10 — Look & Feel (`v1.2.0`)

Goal:
- deliver dark theme, background parallax, English locale, and multi-currency display
- no schema migrations required; all changes are frontend-only

Status:
- in progress

Execution backlog:
1. ✅ Dark theme — CSS variable toggle, `localStorage` persistence, `prefers-color-scheme` default
2. ✅ Background parallax — subtle depth effect on the wallpaper pattern, CSS or JS-driven
3. English locale — `en/` i18n dictionary, locale switcher in header, browser auto-detect
4. Multiple currencies — currency preference per user profile, locale-aware display formatting

Recommended issue shape:
- `M10-I1 Dark theme — CSS variable toggle and system preference default`
- `M10-I2 Background parallax — depth effect on wallpaper pattern`
- `M10-I3 English locale — en/ dictionary, locale switcher, browser auto-detect`
- `M10-I4 Multiple currencies — currency preference in profile, display formatting`

Recommended PR order:
1. `M10-I1 Dark theme — CSS variable toggle and system preference default`
2. `M10-I2 Background parallax — depth effect on wallpaper pattern`
3. `M10-I3 English locale — en/ dictionary, locale switcher, browser auto-detect`
4. `M10-I4 Multiple currencies — currency preference in profile, display formatting`

Dependencies:
- `M10-I1` has no dependencies
- `M10-I2` has no dependencies
- `M10-I3` has no dependencies; locale switcher touches the header component
- `M10-I4` depends on the user profile (shipped in v1.1.0) for storing the currency preference

Scope notes:
- Dark theme must not introduce client components in pages that are currently server-rendered; use a CSS class on `<html>` toggled by a small script tag or a client component at the layout boundary only. The theme toggle is placed inside the gear-icon dropdown in `NavLinks` (already a client component); no new client boundary is introduced.
- Background parallax must be lightweight — prefer CSS `background-attachment: fixed` or a minimal scroll listener; must not degrade performance on mobile; must work in both light and dark themes.
- English locale duplicates the Russian dictionary in `en/`; no machine translation, write natural English.
- Multiple currencies is display-only — no conversion rates, no external API. The preference is stored on the user profile and applied to all price formatting.

Acceptance targets:
- dark theme can be toggled manually; preference persists across sessions; `prefers-color-scheme: dark` is respected on first visit
- background wallpaper has a visible but subtle parallax depth effect on scroll; no jank on mobile
- all user-visible strings are available in English; switching locale changes the entire UI immediately
- owner can set a preferred currency (e.g. ₽, $, €); all prices display in that currency with correct locale formatting

Exit criteria:
- dark/light toggle works in all routes with no flash on load
- parallax effect is smooth on desktop; gracefully disabled or static on mobile if needed
- English locale covers 100% of i18n keys with no missing-key fallbacks
- currency preference is stored and applied consistently on dashboard, share page, and reservations page

Definition of small PRs for this milestone:
- dark theme PR only touches CSS variables, the theme toggle component, and layout wiring
- parallax PR only touches background rendering; does not touch theme logic or i18n
- locale PR only adds the `en/` dictionary, the switcher UI, and locale resolution logic; does not touch styles
- currency PR only adds the preference field, the settings UI, and the price formatting utility; does not touch locale logic

Release note:
- `v1.2.0` delivers dark theme, background parallax, English language support, and multi-currency price display.

---

### Milestone 11 — Sharing & Backup (`v1.3.0`)

Goal:
- extend share capabilities with a QR code option
- give users data portability via JSON export/import
- allow attaching an image to each wishlist item

Status:
- planned

Execution backlog:
1. QR code for share links — browser-side generation, modal or inline display
2. Export / import wishlist — JSON download, JSON upload with item creation
3. Item image upload — local VPS storage, Caddy serving, `imageUrl` column

Recommended issue shape:
- `M11-I1 QR code for share links — browser-side generation and display`
- `M11-I2 Export / import wishlist — JSON download and upload`
- `M11-I3 Item image upload — VPS local storage, Caddy config, schema addition`

Recommended PR order:
1. `M11-I1 QR code for share links — browser-side generation and display`
2. `M11-I2 Export / import wishlist — JSON download and upload`
3. `M11-I3 Item image upload — VPS local storage, Caddy config, schema addition`

Dependencies:
- `M11-I1` has no dependencies
- `M11-I2` has no dependencies
- `M11-I3` has no dependencies on `M11-I1` or `M11-I2`; done last because it requires ops changes (Caddy config, VPS `/uploads` directory)

Scope notes:
- QR code must be generated entirely in the browser; no backend endpoint required. Use a small, well-maintained library (e.g. `qrcode`).
- Export format is a plain JSON array of items (title, url, note, price, priority). Import creates new items in the current wishlist; it does not overwrite or merge.
- Image upload is one image per item, stored at `/uploads/<uuid>.<ext>` on the VPS. Caddy serves the directory as static files. The `imageUrl` column stores the relative path. Max file size enforced at the Next.js API layer.
- Do not add S3 or CDN in this milestone — local VPS storage is the explicit target.

Acceptance targets:
- owner can open a QR code for an active share link and download or share it
- owner can download their wishlist as a JSON file and re-import it to restore items
- owner can upload one image per item; image is shown on the dashboard and the share page

Exit criteria:
- QR modal works without a server round-trip
- exported JSON is valid and round-trips through import without data loss
- uploaded images are served at a stable URL; Caddy config updated; `imageUrl` migration applied

Definition of small PRs for this milestone:
- QR PR only adds the client-side QR component and wires it to the share link block; does not touch the backend
- export/import PR only adds the download action and the upload/parse flow; does not touch image or QR logic
- image PR only adds the upload API route, the `imageUrl` migration, Caddy static-file config, and item card image rendering

Release note:
- `v1.3.0` adds QR code sharing, wishlist JSON export/import, and per-item image upload.

---

### Milestone 12 — Account Security (`v1.4.0`)

Goal:
- close the remaining auth gaps: email verification and password reset
- both features share the same email-sending infrastructure

Status:
- planned

Execution backlog:
1. Email infrastructure — choose and configure an SMTP or transactional email provider; add env contract
2. Email verification — send verification link on registration; unverified users see a banner
3. Password reset — «Forgot password» flow with a time-limited token sent to email

Recommended issue shape:
- `M12-I1 Email infrastructure — provider setup, env contract, send utility`
- `M12-I2 Email verification — send link on registration, verification endpoint, unverified banner`
- `M12-I3 Password reset — forgot-password form, token generation, reset endpoint`

Recommended PR order:
1. `M12-I1 Email infrastructure — provider setup, env contract, send utility`
2. `M12-I2 Email verification — send link on registration, verification endpoint, unverified banner`
3. `M12-I3 Password reset — forgot-password form, token generation, reset endpoint`

Dependencies:
- `M12-I1` has no dependencies; must land first
- `M12-I2` depends on `M12-I1`
- `M12-I3` depends on `M12-I1`

Scope notes:
- The email provider is a new external dependency; document it in `docs/runtime-environment.md` and add the required env vars to all `.env.*` templates.
- Verification is non-blocking: unverified users can still create wishlists and reserve items, but see a persistent banner prompting them to verify.
- Password reset tokens must be single-use, time-limited (e.g. 1 hour), and stored hashed. Expire on use.
- Do not add email notifications (reservation events) in this milestone — that is a future idea.

Acceptance targets:
- a transactional email is sent on registration with a verification link
- clicking the link marks the user as verified and dismisses the banner
- unverified users see a banner on every page until they verify
- owner can request a password reset from `/login`; an email arrives with a link; the link allows setting a new password exactly once

Exit criteria:
- `EMAIL_*` env vars documented and validated at startup
- `emailVerifiedAt` column migration applied
- password reset token table (or column) migration applied
- verification and reset flows work end-to-end in a production-like environment
- tokens are invalidated after use and after expiry

Definition of small PRs for this milestone:
- infrastructure PR only adds the send utility, env vars, and startup validation; sends no emails from product code
- verification PR only adds the verification email on registration, the `/verify-email` endpoint, and the unverified banner
- reset PR only adds the forgot-password form, token generation, the `/reset-password` endpoint, and token cleanup

Release note:
- `v1.4.0` adds email verification and password reset, closing the core account security gaps.

---

### Milestone 13 — Enrichment (`v1.5.0`)

Goal:
- add light usability improvements that stay within the core wishlist scope
- must not introduce public profiles or social discovery features

Status:
- planned

Execution backlog:
1. Tags / categories for items — owner tags items; filter by tag on dashboard and share page
2. Reserver note to owner — short private note attached to a reservation; shown to owner after the occasion

Recommended issue shape:
- `M13-I1 Tags / categories — schema, tag management UI, filter on dashboard and share page`
- `M13-I2 Reserver note — note field on reservation, display to owner`

Recommended PR order:
1. `M13-I1 Tags / categories — schema, tag management UI, filter on dashboard and share page`
2. `M13-I2 Reserver note — note field on reservation, display to owner`

Dependencies:
- `M13-I1` has no dependencies
- `M13-I2` has no dependencies on `M13-I1`

Scope notes:
- Tags are owner-defined free-text labels per item (e.g. «Книги», «Одежда»). No global tag taxonomy; no tag discovery across users.
- Tag filter is applied client-side or via query param; no dedicated tag pages.
- Reserver note is private — visible only to the item owner, never to other reservers. Timing of reveal (e.g. shown after a configurable date) is a future enhancement; in this milestone the note is shown immediately.
- Do not add comment threads, reactions, or any social surface in this milestone.

Acceptance targets:
- owner can add one or more tags to each item; tags appear on the item card
- dashboard and share page offer a filter by tag; selecting a tag shows only matching items
- reserver can type a short note when reserving an item; the note is shown to the owner on the dashboard

Exit criteria:
- `tags` column (or join table) migration applied; filter works correctly with zero, one, and multiple tags active
- `note` column on `reservations` migration applied; note is shown to owner and hidden from all other actors

Definition of small PRs for this milestone:
- tags PR only adds the schema change, tag input UI on the item form, and the tag filter component; does not touch reservations
- note PR only adds the `note` field to the reservation form and the owner-side display; does not touch tags

Release note:
- `v1.5.0` adds item tags with filtering and a private reserver-to-owner note on each reservation.

---

## Future Ideas (no milestone)

| Idea | Notes |
|---|---|
| **Marketplace image parsing** | Parse a product URL → auto-fill title, price, image from Wildberries / Ozon / etc. Fragile; far future. |
| **Email notifications (opt-in)** | Notify owner when an item is reserved or reservation is cancelled. Requires M12 email infrastructure. |
| **OAuth login** | GitHub, Google, Yandex. Needs account-merging logic if the same person registered by email first. |
| **S3-compatible image storage** | Replace VPS local uploads with Yandex Object Storage or MinIO when scale demands it. |
| **Size / measurement fields in profile** | Structured fields (height, weight, clothing size, shoe size) — after «О себе» bio lands in M9-I4. |
| **Export / import via QR** | Encode a small wishlist into a QR code. Limited by QR data capacity. |
