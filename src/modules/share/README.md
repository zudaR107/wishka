# Share Module

## Current Foundation
- `db/schema.ts`: `share_links` table with opaque `token`, active lifecycle, and
  one current active link per wishlist.
- `server/token.ts`: secure opaque token generation for public share URLs.
- `server/current-share-link.ts`: owner-side current-link read, create, revoke,
  and regenerate helpers for the current wishlist.
- `server/public-wishlist.ts`: public loading helpers that resolve an active
  share token to a read-only wishlist with ordered items and privacy-safe
  reservation state.
- Public share loading can also return a viewer-aware read model for minimal
  auth-sensitive public reservation UX.

## Current Behavior
- `/app` shows the owner a share section for the current wishlist.
- Owners can create, view, revoke, and regenerate the current public share
  link through server-side actions.
- `/share/[token]` renders a public wishlist for valid active tokens with
  reservation-aware item state.
- Guests can see the public wishlist and a login CTA, but not reserve controls.
- Eligible authenticated non-owners can reserve available items from the public
  page through server-side actions.
- Invalid, inactive, revoked, and superseded tokens do not expose wishlist
  data.
- Public item read models expose only `available` or `reserved` state without
  reserver identity.

## Test Coverage
- Unit and integration-like tests cover token generation, owner lifecycle
  helpers, public loading by token, public reserve action behavior, owner
  dashboard share states, and public route rendering states.

## Current Boundaries
- Keep share-token access and public wishlist read models inside the `share`
  module instead of routes.
- Keep reservation creation and cancellation rules inside the `reservation`
  module even when the public route triggers them.
- Milestone 7 should harden and validate the current share behavior without
  adding new share product scope.
