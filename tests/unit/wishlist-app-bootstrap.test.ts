import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  getCurrentWishlistWithItems: vi.fn(),
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
        return "wishka.test";
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
}));

vi.mock("../../src/modules/share", () => ({
  getCurrentShareLink: mocks.getCurrentShareLink,
  getOrCreateCurrentShareLink: mocks.getOrCreateCurrentShareLink,
  revokeCurrentShareLink: mocks.revokeCurrentShareLink,
  regenerateCurrentShareLink: mocks.regenerateCurrentShareLink,
}));

vi.mock("../../src/modules/wishlist/server/items", () => ({
  getCurrentWishlistWithItems: mocks.getCurrentWishlistWithItems,
}));

vi.mock("../../src/modules/wishlist/server/create-item", () => ({
  createCurrentWishlistItem: mocks.createCurrentWishlistItem,
}));

vi.mock("../../src/modules/wishlist/server/manage-item", () => ({
  updateCurrentWishlistItem: mocks.updateCurrentWishlistItem,
  deleteCurrentWishlistItem: mocks.deleteCurrentWishlistItem,
}));

describe("owner app wishlist bootstrap", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.requireCurrentUser.mockReset();
    mocks.getCurrentWishlistWithItems.mockReset();
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
    mocks.getCurrentWishlistWithItems.mockResolvedValue({
      id: "wishlist-1",
      userId: "user-1",
      isActive: true,
      createdAt: new Date("2026-04-11T00:00:00.000Z"),
      updatedAt: new Date("2026-04-11T00:00:00.000Z"),
      items: [],
    });
    mocks.getCurrentShareLink.mockResolvedValue(null);
  });

  it("loads the current wishlist for the authenticated owner on /app", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    await AppPage({});

    expect(mocks.requireCurrentUser).toHaveBeenCalled();
    expect(mocks.getCurrentWishlistWithItems).toHaveBeenCalledWith("user-1");
    expect(mocks.getCurrentShareLink).toHaveBeenCalledWith("user-1");
  });

  it("renders an empty state when the wishlist has no items", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    const page = await AppPage({});
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Вишлист пока пуст");
    expect(html).toContain("Количество желаний");
    expect(html).toContain("Добавить желание");
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

    const { default: AppPage } = await import("../../src/app/app/page");

    const page = await AppPage({});
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Текущая публичная ссылка");
    expect(html).toContain("https://wishka.test/share/opaque-token");
    expect(html).toContain("Отключить ссылку");
    expect(html).toContain("Создать новую ссылку");
    expect(html).not.toContain("Создать публичную ссылку");
  });

  it("renders create success feedback when redirected after item creation", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    const page = await AppPage({
      searchParams: Promise.resolve({ status: "item-created" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Желание добавлено в текущий вишлист.");
  });

  it("renders update and delete success feedback with action-aware state", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    const updatedPage = await AppPage({
      searchParams: Promise.resolve({ status: "item-updated" }),
    });
    const deletedPage = await AppPage({
      searchParams: Promise.resolve({ status: "item-deleted" }),
    });

    expect(renderToStaticMarkup(updatedPage)).toContain("Желание обновлено.");
    expect(renderToStaticMarkup(deletedPage)).toContain("Желание удалено из текущего вишлиста.");
  });

  it("renders share link creation success feedback", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    const page = await AppPage({
      searchParams: Promise.resolve({ status: "share-link-created" }),
    });

    expect(renderToStaticMarkup(page)).toContain("Публичная ссылка готова.");
  });

  it("renders share revoke and regenerate success feedback", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    const revokedPage = await AppPage({
      searchParams: Promise.resolve({ status: "share-link-revoked" }),
    });
    const regeneratedPage = await AppPage({
      searchParams: Promise.resolve({ status: "share-link-regenerated" }),
    });

    expect(renderToStaticMarkup(revokedPage)).toContain("Публичная ссылка отключена.");
    expect(renderToStaticMarkup(regeneratedPage)).toContain("Создана новая публичная ссылка.");
  });

  it("renders action-aware error feedback for create, update, and delete flows", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    const createPage = await AppPage({
      searchParams: Promise.resolve({ action: "create", error: "unknown" }),
    });
    const updatePage = await AppPage({
      searchParams: Promise.resolve({ action: "update", error: "unknown" }),
    });
    const deletePage = await AppPage({
      searchParams: Promise.resolve({ action: "delete", error: "unknown" }),
    });

    expect(renderToStaticMarkup(createPage)).toContain("Не удалось добавить желание. Попробуйте ещё раз.");
    expect(renderToStaticMarkup(updatePage)).toContain("Не удалось сохранить изменения. Попробуйте ещё раз.");
    expect(renderToStaticMarkup(deletePage)).toContain("Не удалось удалить желание. Попробуйте ещё раз.");
  });

  it("renders share create error feedback", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    const page = await AppPage({
      searchParams: Promise.resolve({ action: "share-create", error: "unknown" }),
    });

    expect(renderToStaticMarkup(page)).toContain(
      "Не удалось создать публичную ссылку. Попробуйте ещё раз.",
    );
  });

  it("renders share revoke and regenerate error feedback", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    const revokePage = await AppPage({
      searchParams: Promise.resolve({ action: "share-revoke", error: "unknown" }),
    });
    const regeneratePage = await AppPage({
      searchParams: Promise.resolve({ action: "share-regenerate", error: "unknown" }),
    });

    expect(renderToStaticMarkup(revokePage)).toContain(
      "Не удалось отключить публичную ссылку. Попробуйте ещё раз.",
    );
    expect(renderToStaticMarkup(regeneratePage)).toContain(
      "Не удалось создать новую публичную ссылку. Попробуйте ещё раз.",
    );
  });

  it("renders item-not-found feedback for owner-scoped update or delete failures", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    const page = await AppPage({
      searchParams: Promise.resolve({ action: "update", error: "item-not-found" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Не удалось найти это желание в текущем вишлисте.");
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
    expect(html).toContain("Сохранить изменения");
    expect(html).toContain("Удалить желание");
  });
});
