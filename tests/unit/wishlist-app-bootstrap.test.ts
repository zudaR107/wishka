import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  getCurrentWishlistWithItems: vi.fn(),
  createCurrentWishlistItem: vi.fn(),
}));

vi.mock("../../src/modules/auth/server/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));

vi.mock("../../src/modules/wishlist/server/items", () => ({
  getCurrentWishlistWithItems: mocks.getCurrentWishlistWithItems,
}));

vi.mock("../../src/modules/wishlist/server/create-item", () => ({
  createCurrentWishlistItem: mocks.createCurrentWishlistItem,
}));

describe("owner app wishlist bootstrap", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.requireCurrentUser.mockReset();
    mocks.getCurrentWishlistWithItems.mockReset();
    mocks.createCurrentWishlistItem.mockReset();

    mocks.requireCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
    mocks.getCurrentWishlistWithItems.mockResolvedValue({
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
      items: [],
    });
  });

  it("loads the current wishlist for the authenticated owner on /app", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    await AppPage({});

    expect(mocks.requireCurrentUser).toHaveBeenCalled();
    expect(mocks.getCurrentWishlistWithItems).toHaveBeenCalledWith("user-1");
  });

  it("renders an empty state when the wishlist has no items", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    const page = await AppPage({});
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Вишлист пока пуст");
    expect(html).toContain("Количество желаний");
    expect(html).toContain("Добавить желание");
  });

  it("renders wishlist items when they exist", async () => {
    mocks.getCurrentWishlistWithItems.mockResolvedValue({
      id: "wishlist-1",
      userId: "user-1",
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

    const { default: AppPage } = await import("../../src/app/app/page");

    const page = await AppPage({});
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Наушники");
    expect(html).toContain("https://example.com/item");
    expect(html).toContain("Нужны беспроводные");
    expect(html).toContain("9990.00");
  });
});
