import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findShareLink: vi.fn(),
  getWishlistWithItems: vi.fn(),
  listActiveReservationsByItemIds: vi.fn(),
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    query: {
      shareLinks: {
        findFirst: mocks.findShareLink,
      },
    },
  },
}));

vi.mock("../../src/modules/wishlist/server/items", () => ({
  getWishlistWithItems: mocks.getWishlistWithItems,
}));

vi.mock("../../src/modules/reservation", () => ({
  listActiveReservationsByItemIds: mocks.listActiveReservationsByItemIds,
}));

import {
  getActiveShareLinkByToken,
  getPublicWishlistByShareToken,
  getReservationAwarePublicWishlistByShareToken,
} from "../../src/modules/share/server/public-wishlist";

describe("public wishlist loading by share token", () => {
  beforeEach(() => {
    mocks.findShareLink.mockReset();
    mocks.getWishlistWithItems.mockReset();
    mocks.listActiveReservationsByItemIds.mockReset();
  });

  it("returns null for a missing token", async () => {
    await expect(getActiveShareLinkByToken("")).resolves.toBeNull();
    expect(mocks.findShareLink).not.toHaveBeenCalled();
  });

  it("loads the active share link by opaque token", async () => {
    const shareLink = {
      id: "share-1",
      wishlistId: "wishlist-1",
      token: "opaque-token",
      isActive: true,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-12T00:00:00.000Z"),
    };

    mocks.findShareLink.mockResolvedValue(shareLink);

    await expect(getActiveShareLinkByToken(" opaque-token ")).resolves.toEqual(shareLink);
  });

  it("returns null when the token does not exist", async () => {
    mocks.findShareLink.mockResolvedValue(undefined);

    await expect(getPublicWishlistByShareToken("missing-token")).resolves.toBeNull();
    expect(mocks.getWishlistWithItems).not.toHaveBeenCalled();
  });

  it("returns null when the token is inactive", async () => {
    mocks.findShareLink.mockResolvedValue(undefined);

    await expect(getPublicWishlistByShareToken("inactive-token")).resolves.toBeNull();
    expect(mocks.getWishlistWithItems).not.toHaveBeenCalled();
  });

  it("returns null when the token has been revoked", async () => {
    mocks.findShareLink.mockResolvedValue(undefined);

    await expect(getPublicWishlistByShareToken("revoked-token")).resolves.toBeNull();
    expect(mocks.getWishlistWithItems).not.toHaveBeenCalled();
  });

  it("returns null when the active token points to a missing wishlist", async () => {
    mocks.findShareLink.mockResolvedValue({
      id: "share-1",
      wishlistId: "wishlist-1",
      token: "opaque-token",
      isActive: true,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-12T00:00:00.000Z"),
    });
    mocks.getWishlistWithItems.mockResolvedValue(null);

    await expect(getPublicWishlistByShareToken("opaque-token")).resolves.toBeNull();
  });

  it("loads the public wishlist and items for a valid active token", async () => {
    mocks.findShareLink.mockResolvedValue({
      id: "share-1",
      wishlistId: "wishlist-1",
      token: "opaque-token",
      isActive: true,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-12T00:00:00.000Z"),
    });
    mocks.getWishlistWithItems.mockResolvedValue({
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
          url: "https://example.com/item",
          note: "Нужны беспроводные",
          price: "9990.00",
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
        },
      ],
    });
    mocks.listActiveReservationsByItemIds.mockResolvedValue([]);

    await expect(getPublicWishlistByShareToken("opaque-token")).resolves.toEqual({
      id: "wishlist-1",
      items: [
        {
          id: "item-1",
          wishlistId: "wishlist-1",
          title: "Наушники",
          url: "https://example.com/item",
          note: "Нужны беспроводные",
          price: "9990.00",
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
          reservation: {
            status: "available",
          },
        },
      ],
      shareLink: {
        id: "share-1",
        token: "opaque-token",
      },
    });
  });

  it("loads reservation-aware public item state without exposing reserver identity", async () => {
    mocks.findShareLink.mockResolvedValue({
      id: "share-1",
      wishlistId: "wishlist-1",
      token: "opaque-token",
      isActive: true,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-12T00:00:00.000Z"),
    });
    mocks.getWishlistWithItems.mockResolvedValue({
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
        wishlistItemId: "item-1",
        userId: "user-2",
        cancelledAt: null,
        createdAt: new Date("2026-04-12T00:00:00.000Z"),
      },
    ]);

    await expect(getReservationAwarePublicWishlistByShareToken("opaque-token")).resolves.toEqual({
      id: "wishlist-1",
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
            status: "reserved",
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
            status: "available",
          },
        },
      ],
      shareLink: {
        id: "share-1",
        token: "opaque-token",
      },
    });
    expect(mocks.listActiveReservationsByItemIds).toHaveBeenCalledWith(["item-1", "item-2"]);
  });

  it("loads only the new token after regeneration while the old token stays invalid", async () => {
    mocks.findShareLink
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        id: "share-2",
        wishlistId: "wishlist-1",
        token: "new-token",
        isActive: true,
        createdAt: new Date("2026-04-12T00:00:00.000Z"),
        updatedAt: new Date("2026-04-12T00:00:00.000Z"),
      });
    mocks.getWishlistWithItems.mockResolvedValue({
      id: "wishlist-1",
      userId: "owner-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
      items: [],
    });
    mocks.listActiveReservationsByItemIds.mockResolvedValue([]);

    await expect(getPublicWishlistByShareToken("old-token")).resolves.toBeNull();
    await expect(getPublicWishlistByShareToken("new-token")).resolves.toEqual({
      id: "wishlist-1",
      items: [],
      shareLink: {
        id: "share-2",
        token: "new-token",
      },
    });
  });
});
