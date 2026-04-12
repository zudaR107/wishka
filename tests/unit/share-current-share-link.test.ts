import { beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseError } from "pg";

const mocks = vi.hoisted(() => ({
  findShareLink: vi.fn(),
  insert: vi.fn(),
  insertValues: vi.fn(),
  insertReturning: vi.fn(),
  getCurrentWishlist: vi.fn(),
  getOrCreateCurrentWishlist: vi.fn(),
  generateShareToken: vi.fn(),
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    query: {
      shareLinks: {
        findFirst: mocks.findShareLink,
      },
    },
    insert: mocks.insert,
  },
}));

vi.mock("../../src/modules/wishlist/server/current-wishlist", () => ({
  getCurrentWishlist: mocks.getCurrentWishlist,
  getOrCreateCurrentWishlist: mocks.getOrCreateCurrentWishlist,
}));

vi.mock("../../src/modules/share/server/token", () => ({
  generateShareToken: mocks.generateShareToken,
}));

import {
  getCurrentShareLink,
  getOrCreateCurrentShareLink,
} from "../../src/modules/share/server/current-share-link";

describe("current owner share link helpers", () => {
  beforeEach(() => {
    mocks.findShareLink.mockReset();
    mocks.insert.mockReset();
    mocks.insertValues.mockReset();
    mocks.insertReturning.mockReset();
    mocks.getCurrentWishlist.mockReset();
    mocks.getOrCreateCurrentWishlist.mockReset();
    mocks.generateShareToken.mockReset();

    mocks.insert.mockReturnValue({
      values: mocks.insertValues,
    });
    mocks.insertValues.mockReturnValue({
      returning: mocks.insertReturning,
    });
  });

  it("returns null in read-only mode when the owner has no current wishlist", async () => {
    mocks.getCurrentWishlist.mockResolvedValue(null);

    await expect(getCurrentShareLink("user-1")).resolves.toBeNull();
    expect(mocks.findShareLink).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns the current active share link without creating one in read-only mode", async () => {
    const wishlist = {
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-12T00:00:00.000Z"),
    };
    const shareLink = {
      id: "share-1",
      wishlistId: "wishlist-1",
      token: "opaque-token",
      isActive: true,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-12T00:00:00.000Z"),
    };

    mocks.getCurrentWishlist.mockResolvedValue(wishlist);
    mocks.findShareLink.mockResolvedValue(shareLink);

    await expect(getCurrentShareLink("user-1")).resolves.toEqual(shareLink);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns the existing active share link for the current owner wishlist", async () => {
    const wishlist = {
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-12T00:00:00.000Z"),
    };
    const shareLink = {
      id: "share-1",
      wishlistId: "wishlist-1",
      token: "opaque-token",
      isActive: true,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-12T00:00:00.000Z"),
    };

    mocks.getOrCreateCurrentWishlist.mockResolvedValue(wishlist);
    mocks.findShareLink.mockResolvedValue(shareLink);

    await expect(getOrCreateCurrentShareLink("user-1")).resolves.toEqual(shareLink);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("creates an active share link when the current owner wishlist has none", async () => {
    const wishlist = {
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-12T00:00:00.000Z"),
    };
    const shareLink = {
      id: "share-1",
      wishlistId: "wishlist-1",
      token: "generated-token",
      isActive: true,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-12T00:00:00.000Z"),
    };

    mocks.getOrCreateCurrentWishlist.mockResolvedValue(wishlist);
    mocks.findShareLink.mockResolvedValueOnce(undefined);
    mocks.generateShareToken.mockReturnValue("generated-token");
    mocks.insertReturning.mockResolvedValue([shareLink]);

    await expect(getOrCreateCurrentShareLink("user-1")).resolves.toEqual(shareLink);
    expect(mocks.insertValues).toHaveBeenCalledWith({
      wishlistId: "wishlist-1",
      token: "generated-token",
      isActive: true,
    });
  });

  it("returns the existing active share link when create races with another request", async () => {
    const duplicateKeyError = new DatabaseError("duplicate key", 0, "error");
    duplicateKeyError.code = "23505";

    const wishlist = {
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-12T00:00:00.000Z"),
    };
    const shareLink = {
      id: "share-1",
      wishlistId: "wishlist-1",
      token: "existing-token",
      isActive: true,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-12T00:00:00.000Z"),
    };

    mocks.getOrCreateCurrentWishlist.mockResolvedValue(wishlist);
    mocks.findShareLink.mockResolvedValueOnce(undefined).mockResolvedValueOnce(shareLink);
    mocks.generateShareToken.mockReturnValue("generated-token");
    mocks.insertReturning.mockRejectedValue(duplicateKeyError);

    await expect(getOrCreateCurrentShareLink("user-1")).resolves.toEqual(shareLink);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });
});
