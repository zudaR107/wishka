import React from "react";
import { renderToReadableStream } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  getCurrentUser: vi.fn(),
  getCurrentOwnerWishlistWithReservations: vi.fn(),
  getCurrentShareLink: vi.fn(),
  getOrCreateCurrentShareLink: vi.fn(),
  revokeCurrentShareLink: vi.fn(),
  regenerateCurrentShareLink: vi.fn(),
  createCurrentWishlistItem: vi.fn(),
  updateCurrentWishlistItem: vi.fn(),
  deleteCurrentWishlistItem: vi.fn(),
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
}));

vi.mock("../../src/modules/auth/server/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("../../src/modules/share", () => ({
  getCurrentShareLink: mocks.getCurrentShareLink,
  getOrCreateCurrentShareLink: mocks.getOrCreateCurrentShareLink,
  revokeCurrentShareLink: mocks.revokeCurrentShareLink,
  regenerateCurrentShareLink: mocks.regenerateCurrentShareLink,
}));

vi.mock("../../src/modules/reservation", () => ({
  getCurrentOwnerWishlistWithReservations: mocks.getCurrentOwnerWishlistWithReservations,
}));

vi.mock("../../src/modules/wishlist/server/create-item", () => ({
  createCurrentWishlistItem: mocks.createCurrentWishlistItem,
}));

vi.mock("../../src/modules/wishlist/server/manage-item", () => ({
  updateCurrentWishlistItem: mocks.updateCurrentWishlistItem,
  deleteCurrentWishlistItem: mocks.deleteCurrentWishlistItem,
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

describe("owner app wishlist bootstrap", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.requireCurrentUser.mockReset();
    mocks.getCurrentUser.mockReset();
    mocks.getCurrentOwnerWishlistWithReservations.mockReset();
    mocks.getCurrentShareLink.mockReset();
    mocks.getOrCreateCurrentShareLink.mockReset();
    mocks.revokeCurrentShareLink.mockReset();
    mocks.regenerateCurrentShareLink.mockReset();
    mocks.createCurrentWishlistItem.mockReset();
    mocks.updateCurrentWishlistItem.mockReset();
    mocks.deleteCurrentWishlistItem.mockReset();

    mocks.requireCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
    mocks.getCurrentOwnerWishlistWithReservations.mockResolvedValue({
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
      items: [],
    });
    mocks.getCurrentShareLink.mockResolvedValue(null);
  });

  it("loads the current wishlist for the authenticated owner on /", async () => {
    const { default: AppPage } = await import("../../src/app/page");

    // render triggers DashboardView which calls data-loading functions
    await render(await AppPage({}));

    expect(mocks.getCurrentUser).toHaveBeenCalled();
    expect(mocks.getCurrentOwnerWishlistWithReservations).toHaveBeenCalledWith("user-1");
    expect(mocks.getCurrentShareLink).toHaveBeenCalledWith("user-1");
  });

  it("renders an empty state when the wishlist has no items", async () => {
    const { default: AppPage } = await import("../../src/app/page");

    const html = await render(await AppPage({}));

    expect(html).toContain("Список пока пуст");
    expect(html).toContain("желаний");
    expect(html).toContain("Добавить желание");
    expect(html).toContain("Добавьте первое желание, а потом поделитесь вишлистом по публичной ссылке.");
    expect(html).toContain("Добавить первое желание");
    expect(html).toContain("Публичная ссылка ещё не создана");
    expect(html).toContain("Создать публичную ссылку");
  });

  it("renders the current share link when it already exists", async () => {
    mocks.getCurrentShareLink.mockResolvedValue({
      id: "share-1",
      wishlistId: "wishlist-1",
      token: "opaque-token",
      isActive: true,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-12T00:00:00.000Z"),
    });

    const { default: AppPage } = await import("../../src/app/page");

    const html = await render(await AppPage({}));

    expect(html).toContain("https://wshka.test/share/opaque-token");
    expect(html).toContain("Отключить ссылку");
    expect(html).toContain("Создать новую ссылку");
    expect(html).not.toContain("Создать публичную ссылку");
  });

  it("renders create success feedback when redirected after item creation", async () => {
    const { default: AppPage } = await import("../../src/app/page");

    const html = await render(await AppPage({
      searchParams: Promise.resolve({ status: "item-created" }),
    }));

    expect(html).toContain("Желание добавлено.");
  });

  it("renders update and delete success feedback with action-aware state", async () => {
    const { default: AppPage } = await import("../../src/app/page");

    const [updatedHtml, deletedHtml] = await Promise.all([
      render(await AppPage({ searchParams: Promise.resolve({ status: "item-updated" }) })),
      render(await AppPage({ searchParams: Promise.resolve({ status: "item-deleted" }) })),
    ]);

    expect(updatedHtml).toContain("Желание обновлено.");
    expect(deletedHtml).toContain("Желание удалено.");
  });

  it("renders share link creation success feedback", async () => {
    const { default: AppPage } = await import("../../src/app/page");

    const html = await render(await AppPage({
      searchParams: Promise.resolve({ status: "share-link-created" }),
    }));

    expect(html).toContain("Публичная ссылка готова.");
  });

  it("renders share revoke and regenerate success feedback", async () => {
    const { default: AppPage } = await import("../../src/app/page");

    const [revokedHtml, regeneratedHtml] = await Promise.all([
      render(await AppPage({ searchParams: Promise.resolve({ status: "share-link-revoked" }) })),
      render(await AppPage({ searchParams: Promise.resolve({ status: "share-link-regenerated" }) })),
    ]);

    expect(revokedHtml).toContain("Публичная ссылка отключена.");
    expect(regeneratedHtml).toContain("Создана новая публичная ссылка.");
  });

  it("renders action-aware error feedback for create, update, and delete flows", async () => {
    const { default: AppPage } = await import("../../src/app/page");

    const [createHtml, updateHtml, deleteHtml] = await Promise.all([
      render(await AppPage({ searchParams: Promise.resolve({ action: "create", error: "unknown" }) })),
      render(await AppPage({ searchParams: Promise.resolve({ action: "update", error: "unknown" }) })),
      render(await AppPage({ searchParams: Promise.resolve({ action: "delete", error: "unknown" }) })),
    ]);

    expect(createHtml).toContain("Не удалось добавить желание. Попробуйте ещё раз.");
    expect(updateHtml).toContain("Не удалось сохранить изменения. Попробуйте ещё раз.");
    expect(deleteHtml).toContain("Не удалось удалить желание. Попробуйте ещё раз.");
  });

  it("renders share create error feedback", async () => {
    const { default: AppPage } = await import("../../src/app/page");

    const html = await render(await AppPage({
      searchParams: Promise.resolve({ action: "share-create", error: "unknown" }),
    }));

    expect(html).toContain("Не удалось создать публичную ссылку. Попробуйте ещё раз.");
  });

  it("renders share revoke and regenerate error feedback", async () => {
    const { default: AppPage } = await import("../../src/app/page");

    const [revokeHtml, regenerateHtml] = await Promise.all([
      render(await AppPage({ searchParams: Promise.resolve({ action: "share-revoke", error: "unknown" }) })),
      render(await AppPage({ searchParams: Promise.resolve({ action: "share-regenerate", error: "unknown" }) })),
    ]);

    expect(revokeHtml).toContain("Не удалось отключить публичную ссылку. Попробуйте ещё раз.");
    expect(regenerateHtml).toContain("Не удалось создать новую публичную ссылку. Попробуйте ещё раз.");
  });

  it("renders item-not-found feedback for owner-scoped update or delete failures", async () => {
    const { default: AppPage } = await import("../../src/app/page");

    const html = await render(await AppPage({
      searchParams: Promise.resolve({ action: "update", error: "item-not-found" }),
    }));

    expect(html).toContain("Не удалось найти это желание в текущем вишлисте.");
  });

  it("renders wishlist items when they exist", async () => {
    mocks.getCurrentOwnerWishlistWithReservations.mockResolvedValue({
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
          price: "9990",
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
          reservation: {
            status: "reserved",
          },
        },
      ],
    });

    const { default: AppPage } = await import("../../src/app/page");

    const html = await render(await AppPage({}));

    expect(html).toContain("Наушники");
    expect(html).toContain("https://example.com/item");
    expect(html).toContain("Нужны беспроводные");
    expect(html).toContain("9990");
    expect(html).toContain("Статус: забронировано");
    expect(html).toContain("Сохранить");
    expect(html).toContain("Удалить");
  });

  it("renders privacy-safe item status without reserver identity", async () => {
    mocks.getCurrentOwnerWishlistWithReservations.mockResolvedValue({
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
          url: null,
          note: null,
          price: null,
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
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
          reservation: {
            status: "reserved",
          },
        },
      ],
    });

    const { default: AppPage } = await import("../../src/app/page");

    const html = await render(await AppPage({}));

    expect(html).toContain("Статус: доступно");
    expect(html).toContain("Статус: забронировано");
    expect(html).not.toContain("user-2");
    expect(html).not.toContain("@example.com");
  });
});
