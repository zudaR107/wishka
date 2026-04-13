# Reservation Module

## Current State
- `src/modules/reservation/db/schema.ts` owns the reservation DB foundation.
- `src/modules/reservation/server/lifecycle.ts` owns reservation lifecycle and
  eligibility rules.
- `src/modules/reservation/server/owner-wishlist.ts` builds the privacy-safe
  owner read model used on `/app`.
- `src/modules/reservation/server/current-user-reservations.ts` builds the
  current-user active reservation list used on `/app/reservations`.
- `reservations` stores reservation history per wishlist item without adding
  reserved flags to `wishlist_items`.
- `/share/[token]` supports public reservation create flow for eligible
  authenticated non-owners.
- `/app` shows privacy-safe reserved status without reserver identity.
- `/app/reservations` is a protected reserver page with active reservation list
  and cancel flow.

## Schema Foundation
- Each reservation belongs to one `wishlist_item` and one authenticated
  reserver `user`.
- Active reservation state is derived from `cancelled_at IS NULL`.
- A partial unique index restricts each wishlist item to at most one active
  reservation while preserving canceled history.

## Helper Foundation
- `getActiveReservationByItemId(...)` reads the current active reservation for
  one item.
- `listActiveReservationsByItemIds(...)` batches active reservation reads across
  many wishlist items.
- `getItemReservationAvailability(...)` and
  `getItemReservationEligibility(...)` centralize availability and ownership
  checks for future route-level flows.
- `createReservation(...)` and `cancelReservation(...)` enforce the minimal
  lifecycle rules inside the module layer.
- `getCurrentOwnerWishlistWithReservations(...)` builds a privacy-safe owner
  read model with `available` or `reserved` item state and no reserver identity.
- `listCurrentUserActiveReservations(...)` builds the active reservation list
  for the authenticated reserver page and cancel flow.

## Current Behavior
- Active reservation state is derived only from reservation records.
- Authenticated non-owners can reserve available items from public share pages.
- Guests can view public wishlists but cannot reserve.
- Owners can see `available` or `reserved` state on `/app` without seeing who
  reserved an item.
- Reservers can review and cancel only their own active reservations on
  `/app/reservations`.

## Test Coverage
- Focused tests cover lifecycle rules, reservation-aware public loading, public
  reserve flow, owner privacy-safe rendering, and current-user cancel behavior.

## Current Boundaries
- Reservation mutations and lifecycle rules stay in the `reservation` module.
- Share-token access and public wishlist read models stay in the `share`
  module.
- Milestone 7 should harden and validate this behavior without adding new
  reservation product scope.
