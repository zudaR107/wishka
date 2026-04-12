import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findShareLink: vi.fn(),
  getWishlistWithItems: vi.fn(),
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

import {
  getActiveShareLinkByToken,
  getPublicWishlistByShareToken,
} from "../../src/modules/share/server/public-wishlist";

describe("public wishlist loading by share token", () => {
  beforeEach(() => {
    mocks.findShareLink.mockReset();
    mocks.getWishlistWithItems.mockReset();
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
        },
      ],
      shareLink: {
        id: "share-1",
        token: "opaque-token",
      },
    });
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
