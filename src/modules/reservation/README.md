# Reservation Module

## Current State
- `src/modules/reservation/db/schema.ts` now owns the reservation DB
  foundation.
- `src/modules/reservation/server/lifecycle.ts` now owns reservation helper and
  lifecycle rule foundation.
- `reservations` stores reservation history per wishlist item without adding
  reserved flags to `wishlist_items`.
- `/app/reservations` still exists as a protected route placeholder for a later
  issue in this milestone.

## Schema Foundation
- Each reservation belongs to one `wishlist_item` and one authenticated
  reserver `user`.
- Active reservation state is derived from `cancelled_at IS NULL`.
- A partial unique index restricts each wishlist item to at most one active
  reservation while preserving canceled history.

## Helper Foundation
- `getActiveReservationByItemId(...)` reads the current active reservation for
  one item.
- `getItemReservationAvailability(...)` and
  `getItemReservationEligibility(...)` centralize availability and ownership
  checks for future route-level flows.
- `createReservation(...)` and `cancelReservation(...)` enforce the minimal
  lifecycle rules inside the module layer.
- `getCurrentOwnerWishlistWithReservations(...)` builds a privacy-safe owner
  read model with `available` or `reserved` item state and no reserver identity.

## Planned Role
- Model active reservation records for wishlist items.
- Let authenticated non-owners reserve items from public share pages.
- Let reservers review and cancel their own active reservations.
- Let owners see reserved status without learning reserver identity.

## Next Milestone Scope
- Add reservation schema, lifecycle helpers, public reservation flow, owner
  privacy-safe reserved status, and current-user reservation views in Milestone
  5.
