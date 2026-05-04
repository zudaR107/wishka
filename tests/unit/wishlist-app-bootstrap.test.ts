import React from "react";
import { renderToReadableStream } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  getCurrentUser: vi.fn(),
  getAllOwnerWishlistsWithReservations: vi.fn(),
  getOrCreateShareLinkForWishlist: vi.fn(),
  regenerateShareLinkForWishlist: vi.fn(),
  createCurrentWishlistItem: vi.fn(),
  updateCurrentWishlistItem: vi.fn(),
  deleteCurrentWishlistItem: vi.fn(),
  getUserProfile: vi.fn(),
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

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn().mockReturnValue({ refresh: vi.fn() }),
}));

vi.mock("../../src/modules/auth/server/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("../../src/modules/share", () => ({
  getOrCreateShareLinkForWishlist: mocks.getOrCreateShareLinkForWishlist,
  regenerateShareLinkForWishlist: mocks.regenerateShareLinkForWishlist,
}));

vi.mock("../../src/modules/reservation", () => ({
  getAllOwnerWishlistsWithReservations: mocks.getAllOwnerWishlistsWithReservations,
  createReservation: vi.fn(),
  cancelReservation: vi.fn(),
}));

vi.mock("../../src/modules/wishlist/server/create-item", () => ({
  createCurrentWishlistItem: mocks.createCurrentWishlistItem,
}));

vi.mock("../../src/modules/wishlist/server/manage-item", () => ({
  updateCurrentWishlistItem: mocks.updateCurrentWishlistItem,
  deleteCurrentWishlistItem: mocks.deleteCurrentWishlistItem,
}));

vi.mock("../../src/modules/auth/server/update-bio", () => ({
  getUserProfile: mocks.getUserProfile,
}));

/**
 * Render a React element (including async RSC components) to an HTML string.
 * renderToReadableStream supports Suspense and async server components (React 19).
 */
async function render(element: React.ReactElement): Promise<string> {
  const stream = await renderToReadableStream(element);
  await stream.allReady;
  return new Response(stream).text();
}

const baseWishlist = {
  id: "wishlist-1",
  userId: "user-1",
  name: "Мой список",
  isActive: true,
  createdAt: new Date("2026-04-11T00:00:00.000Z"),
  updatedAt: new Date("2026-04-11T00:00:00.000Z"),
  items: [],
};

const baseShareLink = {
  id: "share-1",
  wishlistId: "wishlist-1",
  token: "default-token",
  isActive: true,
  createdAt: new Date("2026-04-11T00:00:00.000Z"),
  updatedAt: new Date("2026-04-11T00:00:00.000Z"),
};

describe("owner app wishlist bootstrap", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.requireCurrentUser.mockReset();
    mocks.getCurrentUser.mockReset();
    mocks.getAllOwnerWishlistsWithReservations.mockReset();
    mocks.getOrCreateShareLinkForWishlist.mockReset();
    mocks.regenerateShareLinkForWishlist.mockReset();
    mocks.createCurrentWishlistItem.mockReset();
    mocks.updateCurrentWishlistItem.mockReset();
    mocks.deleteCurrentWishlistItem.mockReset();
    mocks.getUserProfile.mockReset();

    mocks.requireCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
    mocks.getAllOwnerWishlistsWithReservations.mockResolvedValue([baseWishlist]);
    mocks.getOrCreateShareLinkForWishlist.mockResolvedValue(baseShareLink);
    mocks.getUserProfile.mockResolvedValue({ preferredCurrency: "RUB", bio: null });
  });

  it("loads all wishlists for the authenticated owner on /", async () => {
    const { default: AppPage } = await import("../../src/app/page");

    await render(await AppPage({}));

    expect(mocks.getCurrentUser).toHaveBeenCalled();
    expect(mocks.getAllOwnerWishlistsWithReservations).toHaveBeenCalledWith("user-1");
    expect(mocks.getOrCreateShareLinkForWishlist).toHaveBeenCalledWith("wishlist-1");
  });

  it("renders an empty state when the wishlist has no items", async () => {
    const { default: AppPage } = await import("../../src/app/page");

    const html = await render(await AppPage({}));

    expect(html).toContain("Список пока пуст");
    expect(html).toContain("желаний");
    expect(html).toContain("Добавить желание");
    expect(html).toContain("Добавьте первое желание, а потом поделитесь вишлистом по публичной ссылке.");
    expect(html).toContain("Добавить первое желание");
    expect(html).toContain("Сменить ссылку");
  });

  it("renders the current share link", async () => {
    const { default: AppPage } = await import("../../src/app/page");

    const html = await render(await AppPage({}));

    expect(html).toContain("https://wshka.test/share/default-token");
    expect(html).toContain("Сменить ссылку");
    expect(html).not.toContain("Отключить ссылку");
  });

  it("renders wishlist items when they exist", async () => {
    mocks.getAllOwnerWishlistsWithReservations.mockResolvedValue([{
      ...baseWishlist,
      items: [
        {
          id: "item-1",
          wishlistId: "wishlist-1",
          title: "Наушники",
          url: "https://example.com/item",
          note: "Нужны беспроводные",
          price: "9990",
          starred: false,
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
          reservation: {
            status: "reserved",
          },
        },
      ],
    }]);

    const { default: AppPage } = await import("../../src/app/page");

    const html = await render(await AppPage({}));

    expect(html).toContain("Наушники");
    expect(html).toContain("https://example.com/item");
    expect(html).toContain("Нужны беспроводные");
    expect(html).toContain("9 990");
    expect(html).toContain("Статус: забронировано");
    expect(html).toContain("Редактировать");
    expect(html).toContain("Удалить");
  });

  it("renders privacy-safe item status without reserver identity", async () => {
    mocks.getAllOwnerWishlistsWithReservations.mockResolvedValue([{
      ...baseWishlist,
      items: [
        {
          id: "item-1",
          wishlistId: "wishlist-1",
          title: "Наушники",
          url: null,
          note: null,
          price: null,
          starred: false,
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
          reservation: {
            status: "available",
          },
        },
        {
          id: "item-2",
          wishlistId: "wishlist-1",
          title: "Книга",
          url: null,
          note: null,
          price: null,
          starred: false,
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
          reservation: {
            status: "reserved",
          },
        },
      ],
    }]);

    const { default: AppPage } = await import("../../src/app/page");

    const html = await render(await AppPage({}));

    expect(html).toContain("Статус: доступно");
    expect(html).toContain("Статус: забронировано");
    expect(html).not.toContain("user-2");
    expect(html).not.toContain("@example.com");
  });

  it("renders the landing page with JSON-LD structured data for unauthenticated users", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const { default: AppPage } = await import("../../src/app/page");

    const html = await render(await AppPage({}));

    expect(html).toContain("application/ld+json");
    expect(html).toContain("WebApplication");
    expect(html).toContain("wshka.ru");
  });
});
