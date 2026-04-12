import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  getCurrentWishlistWithItems: vi.fn(),
  getCurrentOwnerWishlistWithReservations: vi.fn(),
  listCurrentUserActiveReservations: vi.fn(),
  getCurrentShareLink: vi.fn(),
  getOrCreateCurrentShareLink: vi.fn(),
  revokeCurrentShareLink: vi.fn(),
  regenerateCurrentShareLink: vi.fn(),
  createCurrentWishlistItem: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: (name: string) => {
      if (name === "host") {
        return "wshka.test";
      }

      if (name === "x-forwarded-proto") {
        return "https";
      }

      return null;
    },
  }),
  cookies: vi.fn(),
}));

vi.mock("../../src/modules/auth/server/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));

vi.mock("../../src/modules/wishlist/server/items", () => ({
  getCurrentWishlistWithItems: mocks.getCurrentWishlistWithItems,
}));

vi.mock("../../src/modules/reservation", () => ({
  getCurrentOwnerWishlistWithReservations: mocks.getCurrentOwnerWishlistWithReservations,
  listCurrentUserActiveReservations: mocks.listCurrentUserActiveReservations,
  cancelReservation: vi.fn(),
}));

vi.mock("../../src/modules/share", () => ({
  getCurrentShareLink: mocks.getCurrentShareLink,
  getOrCreateCurrentShareLink: mocks.getOrCreateCurrentShareLink,
  revokeCurrentShareLink: mocks.revokeCurrentShareLink,
  regenerateCurrentShareLink: mocks.regenerateCurrentShareLink,
}));

vi.mock("../../src/modules/wishlist/server/create-item", () => ({
  createCurrentWishlistItem: mocks.createCurrentWishlistItem,
}));

describe("protected owner routes", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.requireCurrentUser.mockReset();
    mocks.getCurrentWishlistWithItems.mockReset();
    mocks.getCurrentOwnerWishlistWithReservations.mockReset();
    mocks.listCurrentUserActiveReservations.mockReset();
    mocks.getCurrentShareLink.mockReset();
    mocks.getOrCreateCurrentShareLink.mockReset();
    mocks.revokeCurrentShareLink.mockReset();
    mocks.regenerateCurrentShareLink.mockReset();
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
    mocks.getCurrentOwnerWishlistWithReservations.mockResolvedValue({
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
      items: [],
    });
    mocks.listCurrentUserActiveReservations.mockResolvedValue([]);
    mocks.getCurrentShareLink.mockResolvedValue(null);
  });

  it("guards /app on the server", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    await AppPage({});

    expect(mocks.requireCurrentUser).toHaveBeenCalled();
  });

  it("guards /app/reservations on the server", async () => {
    const { default: ReservationsPage } = await import("../../src/app/app/reservations/page");

    await ReservationsPage({});

    expect(mocks.requireCurrentUser).toHaveBeenCalled();
  });
});
