import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  insert: vi.fn(),
  insertValues: vi.fn(),
  insertReturning: vi.fn(),
  update: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  updateReturning: vi.fn(),
  deleteItem: vi.fn(),
  deleteWhere: vi.fn(),
  deleteReturning: vi.fn(),
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    query: {
      wishlists: {
        findFirst: mocks.findFirst,
        findMany: mocks.findMany,
      },
    },
    insert: mocks.insert,
    update: mocks.update,
    delete: mocks.deleteItem,
  },
}));

import {
  getCurrentWishlist,
  getOrCreateCurrentWishlist,
  getWishlistForUser,
  getUserWishlists,
  createWishlist,
  renameWishlist,
  deleteWishlist,
} from "../../src/modules/wishlist/server/current-wishlist";

const baseWishlist = {
  id: "wishlist-1",
  userId: "user-1",
  name: "Мой список",
  isActive: true,
  createdAt: new Date("2026-04-11T00:00:00.000Z"),
  updatedAt: new Date("2026-04-11T00:00:00.000Z"),
};

describe("current owner wishlist bootstrap", () => {
  beforeEach(() => {
    mocks.findFirst.mockReset();
    mocks.insert.mockReset();
    mocks.insertValues.mockReset();
    mocks.insertReturning.mockReset();

    mocks.insert.mockReturnValue({ values: mocks.insertValues });
    mocks.insertValues.mockReturnValue({ returning: mocks.insertReturning });
  });

  it("returns the current wishlist without creating one in read-only mode", async () => {
    mocks.findFirst.mockResolvedValueOnce(baseWishlist);

    await expect(getCurrentWishlist("user-1")).resolves.toEqual(baseWishlist);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns null in read-only mode when the owner has no wishlist", async () => {
    mocks.findFirst
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await expect(getCurrentWishlist("user-1")).resolves.toBeNull();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns the current active wishlist when it exists", async () => {
    mocks.findFirst.mockResolvedValueOnce(baseWishlist);

    await expect(getOrCreateCurrentWishlist("user-1")).resolves.toEqual(baseWishlist);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("falls back to the oldest existing wishlist when no active wishlist exists", async () => {
    const inactive = { ...baseWishlist, isActive: false };
    mocks.findFirst
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(inactive);

    await expect(getOrCreateCurrentWishlist("user-1")).resolves.toEqual(inactive);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("creates a wishlist with the default name when the owner has none", async () => {
    mocks.findFirst
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);
    mocks.insertReturning.mockResolvedValue([baseWishlist]);

    await expect(getOrCreateCurrentWishlist("user-1")).resolves.toEqual(baseWishlist);
    expect(mocks.insertValues).toHaveBeenCalledWith({
      userId: "user-1",
      name: "Мой список",
      isActive: true,
    });
  });

  it("does not create duplicates on repeated reads after bootstrap", async () => {
    mocks.findFirst
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(baseWishlist);
    mocks.insertReturning.mockResolvedValue([baseWishlist]);

    await expect(getOrCreateCurrentWishlist("user-1")).resolves.toEqual(baseWishlist);
    await expect(getOrCreateCurrentWishlist("user-1")).resolves.toEqual(baseWishlist);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });
});

describe("getWishlistForUser", () => {
  beforeEach(() => {
    mocks.findFirst.mockReset();
  });

  it("returns the wishlist when it belongs to the user", async () => {
    mocks.findFirst.mockResolvedValueOnce(baseWishlist);

    await expect(getWishlistForUser("wishlist-1", "user-1")).resolves.toEqual(baseWishlist);
  });

  it("returns null when the wishlist does not belong to the user", async () => {
    mocks.findFirst.mockResolvedValueOnce(undefined);

    await expect(getWishlistForUser("wishlist-1", "other-user")).resolves.toBeNull();
  });
});

describe("getUserWishlists", () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
  });

  it("returns all wishlists for the user in creation order", async () => {
    const wishlists = [
      baseWishlist,
      { ...baseWishlist, id: "wishlist-2", name: "День рождения" },
    ];
    mocks.findMany.mockResolvedValueOnce(wishlists);

    await expect(getUserWishlists("user-1")).resolves.toEqual(wishlists);
  });

  it("returns an empty array when the user has no wishlists", async () => {
    mocks.findMany.mockResolvedValueOnce([]);

    await expect(getUserWishlists("user-1")).resolves.toEqual([]);
  });
});

describe("createWishlist", () => {
  beforeEach(() => {
    mocks.insert.mockReset();
    mocks.insertValues.mockReset();
    mocks.insertReturning.mockReset();

    mocks.insert.mockReturnValue({ values: mocks.insertValues });
    mocks.insertValues.mockReturnValue({ returning: mocks.insertReturning });
  });

  it("creates a wishlist and returns the new id", async () => {
    mocks.insertReturning.mockResolvedValue([{ id: "wishlist-new" }]);

    await expect(createWishlist("user-1", "День рождения")).resolves.toEqual({
      status: "success",
      wishlistId: "wishlist-new",
    });
    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", name: "День рождения", isActive: true }),
    );
  });

  it("falls back to the default name when an empty name is given", async () => {
    mocks.insertReturning.mockResolvedValue([{ id: "wishlist-new" }]);

    await createWishlist("user-1", "   ");

    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Мой список" }),
    );
  });

  it("returns error on database failure", async () => {
    mocks.insertReturning.mockRejectedValue(new Error("db error"));

    await expect(createWishlist("user-1", "Новый")).resolves.toEqual({
      status: "error",
      code: "unknown",
    });
  });
});

describe("renameWishlist", () => {
  beforeEach(() => {
    mocks.update.mockReset();
    mocks.updateSet.mockReset();
    mocks.updateWhere.mockReset();
    mocks.updateReturning.mockReset();

    mocks.update.mockReturnValue({ set: mocks.updateSet });
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
    mocks.updateWhere.mockReturnValue({ returning: mocks.updateReturning });
  });

  it("renames the wishlist when it belongs to the user", async () => {
    mocks.updateReturning.mockResolvedValue([{ id: "wishlist-1" }]);

    await expect(renameWishlist("wishlist-1", "user-1", "Новое имя")).resolves.toEqual({
      status: "success",
    });
    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Новое имя" }),
    );
  });

  it("returns not-found when the wishlist does not belong to the user", async () => {
    mocks.updateReturning.mockResolvedValue([]);

    await expect(renameWishlist("wishlist-1", "other-user", "Новое имя")).resolves.toEqual({
      status: "error",
      code: "not-found",
    });
  });

  it("falls back to the default name when an empty name is given", async () => {
    mocks.updateReturning.mockResolvedValue([{ id: "wishlist-1" }]);

    await renameWishlist("wishlist-1", "user-1", "  ");

    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Мой список" }),
    );
  });
});

describe("deleteWishlist", () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
    mocks.deleteItem.mockReset();
    mocks.deleteWhere.mockReset();
    mocks.deleteReturning.mockReset();

    mocks.deleteItem.mockReturnValue({ where: mocks.deleteWhere });
    mocks.deleteWhere.mockReturnValue({ returning: mocks.deleteReturning });
  });

  it("deletes the wishlist when the user has more than one", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "wishlist-1" },
      { id: "wishlist-2" },
    ]);
    mocks.deleteReturning.mockResolvedValue([{ id: "wishlist-2" }]);

    await expect(deleteWishlist("wishlist-2", "user-1")).resolves.toEqual({
      status: "success",
    });
  });

  it("prevents deleting the last remaining wishlist", async () => {
    mocks.findMany.mockResolvedValue([{ id: "wishlist-1" }]);

    await expect(deleteWishlist("wishlist-1", "user-1")).resolves.toEqual({
      status: "error",
      code: "last-wishlist",
    });
    expect(mocks.deleteItem).not.toHaveBeenCalled();
  });

  it("returns not-found when the wishlist does not belong to the user", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "wishlist-1" },
      { id: "wishlist-2" },
    ]);
    mocks.deleteReturning.mockResolvedValue([]);

    await expect(deleteWishlist("wishlist-1", "other-user")).resolves.toEqual({
      status: "error",
      code: "not-found",
    });
  });
});
