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

## Current Behavior
- `/app` shows the owner a share section for the current wishlist.
- Owners can create, view, revoke, and regenerate the current public share
  link through server-side actions.
- `/share/[token]` renders a public read-only wishlist for valid active tokens.
- Invalid, inactive, revoked, and superseded tokens do not expose wishlist
  data.
- Public item read models expose only `available` or `reserved` state without
  reserver identity.

## Test Coverage
- Unit and integration-like tests cover token generation, owner lifecycle
  helpers, public loading by token, owner dashboard share states, and public
  route rendering states.

## Scope
- Keep share behavior read-only on the public route in Milestone 4.
- Keep share lifecycle logic inside the `share` module instead of routes.
- Keep reservation behavior in the upcoming `reservation` milestone.
