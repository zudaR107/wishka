# Wishlist Module

## Current Foundation
- `db/schema.ts`: first-class `wishlists` and `wishlist_items` tables
- `server/current-wishlist.ts`: read-only current wishlist lookup plus bootstrap
  helper for the single-wishlist owner flow
- `server/items.ts`: read helpers for wishlist records and ordered item lists
- `server/item-input.ts`: shared server-side validation and normalization for
  item writes
- `server/create-item.ts`: owner-side item creation in the current wishlist
- `server/manage-item.ts`: owner-side item update and delete for the current
  wishlist

## Current Behavior
- `/app` always resolves one current wishlist for the authenticated owner.
- The owner dashboard renders either an empty state or the current ordered item
  list.
- Owners can create, update, and delete items through server-side actions.
- Item writes are scoped to the current owner wishlist and reuse the same input
  validation rules.

## Test Coverage
- Unit and integration-like tests cover wishlist bootstrap, read helpers,
  owner-scoped CRUD behavior, dashboard rendering, and action-aware feedback.

## Scope
- Keep the single-active-wishlist rule in business logic for `v1.0.0`, not as a
  schema dead end.
- Keep public sharing inside the existing `share` module instead of mixing it
  into the owner dashboard helpers.
