import React from "react";
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

describe("protected owner routes", () => {
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

  it("guards /app on the server", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    await AppPage({});

    expect(mocks.requireCurrentUser).toHaveBeenCalled();
  });

  it("guards /app/reservations on the server", async () => {
    const { default: ReservationsPage } = await import("../../src/app/app/reservations/page");

    await ReservationsPage();

    expect(mocks.requireCurrentUser).toHaveBeenCalled();
  });
});
