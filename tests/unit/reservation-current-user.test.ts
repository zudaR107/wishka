import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findReservations: vi.fn(),
  findWishlistItems: vi.fn(),
  findWishlists: vi.fn(),
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    query: {
      reservations: {
        findMany: mocks.findReservations,
      },
      wishlistItems: {
        findMany: mocks.findWishlistItems,
      },
      wishlists: {
        findMany: mocks.findWishlists,
      },
    },
  },
}));

import { listCurrentUserActiveReservations } from "../../src/modules/reservation/server/current-user-reservations";

describe("current user active reservations loading", () => {
  beforeEach(() => {
    mocks.findReservations.mockReset();
    mocks.findWishlistItems.mockReset();
    mocks.findWishlists.mockReset();
    mocks.findWishlists.mockResolvedValue([]);
  });

  it("returns only active reservations with item details for the current user", async () => {
    mocks.findReservations.mockResolvedValue([
      {
        id: "reservation-1",
        wishlistItemId: "item-1",
        createdAt: new Date("2026-04-12T00:00:00.000Z"),
      },
    ]);
    mocks.findWishlistItems.mockResolvedValue([
      {
        id: "item-1",
        wishlistId: "wishlist-1",
        title: "Наушники",
        url: "https://example.com/item",
        note: "Нужны беспроводные",
        price: "9990.00",
        createdAt: new Date("2026-04-11T00:00:00.000Z"),
        updatedAt: new Date("2026-04-11T00:00:00.000Z"),
      },
    ]);

    await expect(listCurrentUserActiveReservations("user-1")).resolves.toEqual([
      {
        id: "reservation-1",
        createdAt: new Date("2026-04-12T00:00:00.000Z"),
        isOwnItem: false,
        item: {
          id: "item-1",
          wishlistId: "wishlist-1",
          title: "Наушники",
          url: "https://example.com/item",
          note: "Нужны беспроводные",
          price: "9990.00",
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
        },
      },
    ]);
  });

  it("marks isOwnItem as true when the reserved item belongs to the current user's wishlist", async () => {
    mocks.findReservations.mockResolvedValue([
      {
        id: "reservation-1",
        wishlistItemId: "item-1",
        createdAt: new Date("2026-04-12T00:00:00.000Z"),
      },
    ]);
    mocks.findWishlistItems.mockResolvedValue([
      {
        id: "item-1",
        wishlistId: "wishlist-1",
        title: "Наушники",
        url: null,
        note: null,
        price: null,
        createdAt: new Date("2026-04-11T00:00:00.000Z"),
        updatedAt: new Date("2026-04-11T00:00:00.000Z"),
      },
    ]);
    mocks.findWishlists.mockResolvedValue([{ id: "wishlist-1" }]);

    const result = await listCurrentUserActiveReservations("user-1");

    expect(result[0].isOwnItem).toBe(true);
  });

  it("returns an empty list when the current user has no active reservations", async () => {
    mocks.findReservations.mockResolvedValue([]);

    await expect(listCurrentUserActiveReservations("user-1")).resolves.toEqual([]);
    expect(mocks.findWishlistItems).not.toHaveBeenCalled();
  });

  it("does not return reservations whose linked active item data is missing", async () => {
    mocks.findReservations.mockResolvedValue([
      {
        id: "reservation-1",
        wishlistItemId: "missing-item",
        createdAt: new Date("2026-04-12T00:00:00.000Z"),
      },
    ]);
    mocks.findWishlistItems.mockResolvedValue([]);

    await expect(listCurrentUserActiveReservations("user-1")).resolves.toEqual([]);
  });
});
