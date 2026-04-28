import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWishlistForUser: vi.fn(),
  insert: vi.fn(),
  insertValues: vi.fn(),
}));

vi.mock("../../src/modules/wishlist/server/current-wishlist", () => ({
  getWishlistForUser: mocks.getWishlistForUser,
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
        url: "not a valid url",
        note: "",
        price: "",
      }),
    ).toEqual({ status: "error", code: "invalid-url" });
  });

  it("rejects bare words without a dot as urls", () => {
    expect(
      validateCreateWishlistItemInput({
        title: "Наушники",
        url: "helloworld",
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

  it("accepts a price formatted with NBSP thousands separator and currency symbol", () => {
    expect(
      validateCreateWishlistItemInput({
        title: "Наушники",
        url: "",
        note: "",
        price: "3 490 ₽",
      }),
    ).toEqual({
      status: "valid",
      values: { title: "Наушники", url: null, note: null, price: "3490" },
    });
  });

  it("accepts a url without protocol and prepends https://", () => {
    expect(
      validateCreateWishlistItemInput({
        title: "Наушники",
        url: "example.com",
        note: "",
        price: "",
      }),
    ).toEqual({
      status: "valid",
      values: { title: "Наушники", url: "https://example.com", note: null, price: null },
    });
  });

  it("rejects a price that exceeds the maximum allowed value", () => {
    expect(
      validateCreateWishlistItemInput({
        title: "Наушники",
        url: "",
        note: "",
        price: "1000000000000",
      }),
    ).toEqual({ status: "error", code: "invalid-price" });
  });

  it("accepts a price equal to the maximum allowed value", () => {
    expect(
      validateCreateWishlistItemInput({
        title: "Наушники",
        url: "",
        note: "",
        price: "999999999999",
      }),
    ).toEqual({
      status: "valid",
      values: { title: "Наушники", url: null, note: null, price: "999999999999" },
    });
  });

  it("accepts a zero price", () => {
    expect(
      validateCreateWishlistItemInput({
        title: "Наушники",
        url: "",
        note: "",
        price: "0",
      }),
    ).toEqual({
      status: "valid",
      values: { title: "Наушники", url: null, note: null, price: "0" },
    });
  });
});

describe("wishlist item creation flow", () => {
  beforeEach(() => {
    mocks.getWishlistForUser.mockReset();
    mocks.insert.mockReset();
    mocks.insertValues.mockReset();

    mocks.insert.mockReturnValue({
      values: mocks.insertValues,
    });

    mocks.getWishlistForUser.mockResolvedValue({
      id: "wishlist-1",
      userId: "user-1",
      name: "Мой список",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
    });
  });

  it("creates an item in the specified wishlist", async () => {
    mocks.insertValues.mockResolvedValue(undefined);

    await expect(
      createCurrentWishlistItem("user-1", "wishlist-1", {
        title: " Наушники ",
        url: "https://example.com/item",
        note: " Беспроводные ",
        price: "1990",
      }),
    ).resolves.toEqual({ status: "success" });

    expect(mocks.getWishlistForUser).toHaveBeenCalledWith("wishlist-1", "user-1");
    expect(mocks.insertValues).toHaveBeenCalledWith({
      wishlistId: "wishlist-1",
      title: "Наушники",
      url: "https://example.com/item",
      note: "Беспроводные",
      price: "1990",
      starred: false,
    });
  });

  it("creates a starred item when starred flag is true", async () => {
    mocks.getWishlistForUser.mockResolvedValue({ id: "wishlist-1" });

    await expect(
      createCurrentWishlistItem(
        "user-1",
        "wishlist-1",
        { title: "Наушники", url: "", note: "", price: "" },
        true,
      ),
    ).resolves.toEqual({ status: "success" });

    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ starred: true }),
    );
  });

  it("returns error when the wishlist does not belong to the user", async () => {
    mocks.getWishlistForUser.mockResolvedValue(null);

    await expect(
      createCurrentWishlistItem("user-1", "wishlist-1", {
        title: "Наушники",
        url: "",
        note: "",
        price: "",
      }),
    ).resolves.toEqual({ status: "error", code: "unknown" });

    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
