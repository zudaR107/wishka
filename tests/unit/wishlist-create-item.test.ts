import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOrCreateCurrentWishlist: vi.fn(),
  insert: vi.fn(),
  insertValues: vi.fn(),
}));

vi.mock("../../src/modules/wishlist/server/current-wishlist", () => ({
  getOrCreateCurrentWishlist: mocks.getOrCreateCurrentWishlist,
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    insert: mocks.insert,
  },
}));

import {
  createCurrentWishlistItem,
  validateCreateWishlistItemInput,
} from "../../src/modules/wishlist/server/create-item";

describe("wishlist item creation validation", () => {
  it("requires a non-empty title", () => {
    expect(
      validateCreateWishlistItemInput({
        title: "   ",
        url: "",
        note: "",
        price: "",
      }),
    ).toEqual({ status: "error", code: "invalid-title" });
  });

  it("rejects invalid urls when provided", () => {
    expect(
      validateCreateWishlistItemInput({
        title: "Наушники",
        url: "not-a-url",
        note: "",
        price: "",
      }),
    ).toEqual({ status: "error", code: "invalid-url" });
  });

  it("rejects negative prices", () => {
    expect(
      validateCreateWishlistItemInput({
        title: "Наушники",
        url: "",
        note: "",
        price: "-1",
      }),
    ).toEqual({ status: "error", code: "invalid-price" });
  });

  it("rejects non-numeric prices", () => {
    expect(
      validateCreateWishlistItemInput({
        title: "Наушники",
        url: "",
        note: "",
        price: "abc",
      }),
    ).toEqual({ status: "error", code: "invalid-price" });
  });
});

describe("wishlist item creation flow", () => {
  beforeEach(() => {
    mocks.getOrCreateCurrentWishlist.mockReset();
    mocks.insert.mockReset();
    mocks.insertValues.mockReset();

    mocks.insert.mockReturnValue({
      values: mocks.insertValues,
    });
  });

  it("creates an item in the current owner wishlist", async () => {
    mocks.getOrCreateCurrentWishlist.mockResolvedValue({
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
    });
    mocks.insertValues.mockResolvedValue(undefined);

    await expect(
      createCurrentWishlistItem("user-1", {
        title: " Наушники ",
        url: "https://example.com/item",
        note: " Беспроводные ",
        price: "1990",
      }),
    ).resolves.toEqual({ status: "success" });

    expect(mocks.getOrCreateCurrentWishlist).toHaveBeenCalledWith("user-1");
    expect(mocks.insertValues).toHaveBeenCalledWith({
      wishlistId: "wishlist-1",
      title: "Наушники",
      url: "https://example.com/item",
      note: "Беспроводные",
      price: "1990",
    });
  });
});
