import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findWishlistItems: vi.fn(),
  findWishlists: vi.fn(),
  getOrCreateCurrentWishlist: vi.fn(),
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    query: {
      wishlistItems: {
        findMany: mocks.findWishlistItems,
      },
      wishlists: {
        findFirst: mocks.findWishlists,
      },
    },
  },
}));

vi.mock("../../src/modules/wishlist/server/current-wishlist", () => ({
  getOrCreateCurrentWishlist: mocks.getOrCreateCurrentWishlist,
}));

import {
  getCurrentWishlistWithItems,
  getWishlistWithItems,
  listWishlistItems,
} from "../../src/modules/wishlist/server/items";

describe("wishlist item data access", () => {
  beforeEach(() => {
    mocks.findWishlistItems.mockReset();
    mocks.findWishlists.mockReset();
    mocks.getOrCreateCurrentWishlist.mockReset();
  });

  it("lists wishlist items with a predictable order", async () => {
    const items = [
      {
        id: "item-1",
        wishlistId: "wishlist-1",
        title: "Item 1",
        url: null,
        note: null,
        price: null,
        createdAt: new Date("2026-04-11T00:00:00.000Z"),
        updatedAt: new Date("2026-04-11T00:00:00.000Z"),
      },
    ];

    mocks.findWishlistItems.mockResolvedValue(items);

    await expect(listWishlistItems("wishlist-1")).resolves.toEqual(items);
    expect(mocks.findWishlistItems).toHaveBeenCalledOnce();
  });

  it("loads a wishlist together with its items", async () => {
    const wishlist = {
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
    };
    const items = [
      {
        id: "item-1",
        wishlistId: "wishlist-1",
        title: "Item 1",
        url: null,
        note: null,
        price: null,
        createdAt: new Date("2026-04-11T00:00:00.000Z"),
        updatedAt: new Date("2026-04-11T00:00:00.000Z"),
      },
    ];

    mocks.findWishlists.mockResolvedValue(wishlist);
    mocks.findWishlistItems.mockResolvedValue(items);

    await expect(getWishlistWithItems("wishlist-1")).resolves.toEqual({
      ...wishlist,
      items,
    });
  });

  it("returns null when the wishlist does not exist", async () => {
    mocks.findWishlists.mockResolvedValue(undefined);

    await expect(getWishlistWithItems("wishlist-1")).resolves.toBeNull();
    expect(mocks.findWishlistItems).not.toHaveBeenCalled();
  });

  it("loads the current owner wishlist together with its items", async () => {
    const wishlist = {
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
    };
    const items = [
      {
        id: "item-1",
        wishlistId: "wishlist-1",
        title: "Item 1",
        url: null,
        note: null,
        price: null,
        createdAt: new Date("2026-04-11T00:00:00.000Z"),
        updatedAt: new Date("2026-04-11T00:00:00.000Z"),
      },
    ];

    mocks.getOrCreateCurrentWishlist.mockResolvedValue(wishlist);
    mocks.findWishlistItems.mockResolvedValue(items);

    await expect(getCurrentWishlistWithItems("user-1")).resolves.toEqual({
      ...wishlist,
      items,
    });
    expect(mocks.getOrCreateCurrentWishlist).toHaveBeenCalledWith("user-1");
  });
});
