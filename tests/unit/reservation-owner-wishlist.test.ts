import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentWishlistWithItems: vi.fn(),
  listActiveReservationsByItemIds: vi.fn(),
}));

vi.mock("../../src/modules/wishlist/server/items", () => ({
  getCurrentWishlistWithItems: mocks.getCurrentWishlistWithItems,
}));

vi.mock("../../src/modules/reservation/server/lifecycle", () => ({
  listActiveReservationsByItemIds: mocks.listActiveReservationsByItemIds,
}));

import { getCurrentOwnerWishlistWithReservations } from "../../src/modules/reservation/server/owner-wishlist";

describe("owner wishlist reservation-aware loading", () => {
  beforeEach(() => {
    mocks.getCurrentWishlistWithItems.mockReset();
    mocks.listActiveReservationsByItemIds.mockReset();
  });

  it("builds a privacy-safe owner wishlist state with available and reserved items", async () => {
    mocks.getCurrentWishlistWithItems.mockResolvedValue({
      id: "wishlist-1",
      userId: "owner-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
      items: [
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
        {
          id: "item-2",
          wishlistId: "wishlist-1",
          title: "Книга",
          url: null,
          note: null,
          price: null,
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
        },
      ],
    });
    mocks.listActiveReservationsByItemIds.mockResolvedValue([
      {
        id: "reservation-1",
        wishlistItemId: "item-2",
        userId: "user-2",
        cancelledAt: null,
        createdAt: new Date("2026-04-12T00:00:00.000Z"),
      },
    ]);

    await expect(getCurrentOwnerWishlistWithReservations("owner-1")).resolves.toEqual({
      id: "wishlist-1",
      userId: "owner-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
      items: [
        {
          id: "item-1",
          wishlistId: "wishlist-1",
          title: "Наушники",
          url: null,
          note: null,
          price: null,
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
          reservation: {
            status: "available",
          },
        },
        {
          id: "item-2",
          wishlistId: "wishlist-1",
          title: "Книга",
          url: null,
          note: null,
          price: null,
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
          reservation: {
            status: "reserved",
          },
        },
      ],
    });
    expect(mocks.listActiveReservationsByItemIds).toHaveBeenCalledWith(["item-1", "item-2"]);
  });
});
