import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWishlistForUser: vi.fn(),
  update: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  updateReturning: vi.fn(),
  deleteItem: vi.fn(),
  deleteWhere: vi.fn(),
  deleteReturning: vi.fn(),
}));

vi.mock("../../src/modules/wishlist/server/current-wishlist", () => ({
  getWishlistForUser: mocks.getWishlistForUser,
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    update: mocks.update,
    delete: mocks.deleteItem,
  },
}));

import {
  deleteCurrentWishlistItem,
  updateCurrentWishlistItem,
} from "../../src/modules/wishlist/server/manage-item";

const baseWishlist = {
  id: "wishlist-1",
  userId: "user-1",
  name: "Мой список",
  isActive: true,
  createdAt: new Date("2026-04-11T00:00:00.000Z"),
  updatedAt: new Date("2026-04-11T00:00:00.000Z"),
};

describe("wishlist item update flow", () => {
  beforeEach(() => {
    mocks.getWishlistForUser.mockReset();
    mocks.update.mockReset();
    mocks.updateSet.mockReset();
    mocks.updateWhere.mockReset();
    mocks.updateReturning.mockReset();
    mocks.deleteItem.mockReset();
    mocks.deleteWhere.mockReset();
    mocks.deleteReturning.mockReset();

    mocks.update.mockReturnValue({ set: mocks.updateSet });
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
    mocks.updateWhere.mockReturnValue({ returning: mocks.updateReturning });
    mocks.deleteItem.mockReturnValue({ where: mocks.deleteWhere });
    mocks.deleteWhere.mockReturnValue({ returning: mocks.deleteReturning });

    mocks.getWishlistForUser.mockResolvedValue(baseWishlist);
  });

  it("updates an item in the current owner wishlist", async () => {
    mocks.updateReturning.mockResolvedValue([{ id: "item-1" }]);

    await expect(
      updateCurrentWishlistItem("user-1", "wishlist-1", "item-1", {
        title: " Обновленные наушники ",
        url: "https://example.com/item",
        note: " Новая заметка ",
        price: "2990",
      }),
    ).resolves.toEqual({ status: "success" });

    expect(mocks.getWishlistForUser).toHaveBeenCalledWith("wishlist-1", "user-1");
    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Обновленные наушники",
        url: "https://example.com/item",
        note: "Новая заметка",
        price: "2990",
      }),
    );
  });

  it("rejects invalid update input", async () => {
    await expect(
      updateCurrentWishlistItem("user-1", "wishlist-1", "item-1", {
        title: "",
        url: "",
        note: "",
        price: "",
      }),
    ).resolves.toEqual({ status: "error", code: "invalid-title" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns item-not-found when the item is outside the current owner wishlist", async () => {
    mocks.updateReturning.mockResolvedValue([]);

    await expect(
      updateCurrentWishlistItem("user-1", "wishlist-1", "item-1", {
        title: "Наушники",
        url: "",
        note: "",
        price: "",
      }),
    ).resolves.toEqual({ status: "error", code: "item-not-found" });
  });

  it("returns item-not-found when the wishlist does not belong to the user", async () => {
    mocks.getWishlistForUser.mockResolvedValue(null);

    await expect(
      updateCurrentWishlistItem("user-1", "wishlist-1", "item-1", {
        title: "Наушники",
        url: "",
        note: "",
        price: "",
      }),
    ).resolves.toEqual({ status: "error", code: "item-not-found" });
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("wishlist item delete flow", () => {
  beforeEach(() => {
    mocks.getWishlistForUser.mockReset();
    mocks.deleteItem.mockReset();
    mocks.deleteWhere.mockReset();
    mocks.deleteReturning.mockReset();

    mocks.deleteItem.mockReturnValue({ where: mocks.deleteWhere });
    mocks.deleteWhere.mockReturnValue({ returning: mocks.deleteReturning });
    mocks.getWishlistForUser.mockResolvedValue(baseWishlist);
  });

  it("deletes an item from the current owner wishlist", async () => {
    mocks.deleteReturning.mockResolvedValue([{ id: "item-1" }]);

    await expect(deleteCurrentWishlistItem("user-1", "wishlist-1", "item-1")).resolves.toEqual({
      status: "success",
    });
  });

  it("returns item-not-found when delete is outside the current owner wishlist", async () => {
    mocks.deleteReturning.mockResolvedValue([]);

    await expect(deleteCurrentWishlistItem("user-1", "wishlist-1", "item-1")).resolves.toEqual({
      status: "error",
      code: "item-not-found",
    });
  });

  it("returns item-not-found when the wishlist does not belong to the user", async () => {
    mocks.getWishlistForUser.mockResolvedValue(null);

    await expect(deleteCurrentWishlistItem("user-1", "wishlist-1", "item-1")).resolves.toEqual({
      status: "error",
      code: "item-not-found",
    });
    expect(mocks.deleteItem).not.toHaveBeenCalled();
  });
});
