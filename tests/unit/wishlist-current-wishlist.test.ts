import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  insert: vi.fn(),
  insertValues: vi.fn(),
  insertReturning: vi.fn(),
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    query: {
      wishlists: {
        findFirst: mocks.findFirst,
      },
    },
    insert: mocks.insert,
  },
}));

import {
  getCurrentWishlist,
  getOrCreateCurrentWishlist,
} from "../../src/modules/wishlist/server/current-wishlist";

describe("current owner wishlist bootstrap", () => {
  beforeEach(() => {
    mocks.findFirst.mockReset();
    mocks.insert.mockReset();
    mocks.insertValues.mockReset();
    mocks.insertReturning.mockReset();

    mocks.insert.mockReturnValue({
      values: mocks.insertValues,
    });
    mocks.insertValues.mockReturnValue({
      returning: mocks.insertReturning,
    });
  });

  it("returns the current wishlist without creating one in read-only mode", async () => {
    const wishlist = {
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
    };

    mocks.findFirst.mockResolvedValueOnce(wishlist);

    await expect(getCurrentWishlist("user-1")).resolves.toEqual(wishlist);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns null in read-only mode when the owner has no wishlist", async () => {
    mocks.findFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined);

    await expect(getCurrentWishlist("user-1")).resolves.toBeNull();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns the current active wishlist when it exists", async () => {
    const wishlist = {
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
    };

    mocks.findFirst.mockResolvedValueOnce(wishlist);

    await expect(getOrCreateCurrentWishlist("user-1")).resolves.toEqual(wishlist);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("falls back to the oldest existing wishlist when no active wishlist exists", async () => {
    const wishlist = {
      id: "wishlist-1",
      userId: "user-1",
      isActive: false,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
    };

    mocks.findFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce(wishlist);

    await expect(getOrCreateCurrentWishlist("user-1")).resolves.toEqual(wishlist);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("creates a wishlist when the owner does not have one yet", async () => {
    const wishlist = {
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
    };

    mocks.findFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined);
    mocks.insertReturning.mockResolvedValue([wishlist]);

    await expect(getOrCreateCurrentWishlist("user-1")).resolves.toEqual(wishlist);
    expect(mocks.insertValues).toHaveBeenCalledWith({
      userId: "user-1",
      isActive: true,
    });
  });

  it("does not create duplicates on repeated reads after bootstrap", async () => {
    const wishlist = {
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
    };

    mocks.findFirst
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(wishlist);
    mocks.insertReturning.mockResolvedValue([wishlist]);

    await expect(getOrCreateCurrentWishlist("user-1")).resolves.toEqual(wishlist);
    await expect(getOrCreateCurrentWishlist("user-1")).resolves.toEqual(wishlist);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });
});
