import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findReservations: vi.fn(),
  findWishlistItems: vi.fn(),
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
    },
  },
}));

import { listCurrentUserActiveReservations } from "../../src/modules/reservation/server/current-user-reservations";

describe("current user active reservations loading", () => {
  beforeEach(() => {
    mocks.findReservations.mockReset();
    mocks.findWishlistItems.mockReset();
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
