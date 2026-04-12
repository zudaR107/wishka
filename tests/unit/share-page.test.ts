import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getPublicWishlistViewByShareToken: vi.fn(),
}));

vi.mock("../../src/modules/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("../../src/modules/auth/server/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("../../src/modules/share", () => ({
  getPublicWishlistViewByShareToken: mocks.getPublicWishlistViewByShareToken,
}));

vi.mock("../../src/modules/share/server/public-wishlist", () => ({
  getPublicWishlistViewByShareToken: mocks.getPublicWishlistViewByShareToken,
}));

describe("public share route rendering", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.getCurrentUser.mockReset();
    mocks.getPublicWishlistViewByShareToken.mockReset();
    mocks.getCurrentUser.mockResolvedValue(null);
  });

  it("renders an unavailable state for invalid or inactive tokens", async () => {
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(null);

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({
      params: Promise.resolve({ token: "missing-token" }),
    });
    const html = renderToStaticMarkup(page);

    expect(mocks.getPublicWishlistViewByShareToken).toHaveBeenCalledWith("missing-token", undefined);
    expect(html).toContain("Публичная ссылка недоступна");
    expect(html).toContain("Эта ссылка недействительна или больше неактивна.");
  });

  it("renders the same unavailable state for revoked tokens", async () => {
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(null);

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({
      params: Promise.resolve({ token: "revoked-token" }),
    });
    const html = renderToStaticMarkup(page);

    expect(mocks.getPublicWishlistViewByShareToken).toHaveBeenCalledWith("revoked-token", undefined);
    expect(html).toContain("Публичная ссылка недоступна");
    expect(html).toContain("Эта ссылка недействительна или больше неактивна.");
  });

  it("renders an empty public wishlist state when there are no items", async () => {
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue({
      id: "wishlist-1",
      items: [],
      shareLink: {
        id: "share-1",
        token: "opaque-token",
      },
      viewer: {
        isAuthenticated: false,
        isOwner: false,
      },
    });

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({
      params: Promise.resolve({ token: "opaque-token" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Публичный вишлист");
    expect(html).toContain("Этот вишлист пока пуст");
    expect(html).toContain("Владелец ещё не добавил сюда желания.");
  });

  it("shows a login prompt for guests without reserve controls", async () => {
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue({
      id: "wishlist-1",
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
          reservation: {
            status: "available",
          },
        },
      ],
      shareLink: {
        id: "share-1",
        token: "opaque-token",
      },
      viewer: {
        isAuthenticated: false,
        isOwner: false,
      },
    });

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({
      params: Promise.resolve({ token: "opaque-token" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Публичный вишлист");
    expect(html).toContain("Желания");
    expect(html).toContain("Наушники");
    expect(html).toContain("https://example.com/item");
    expect(html).toContain("Нужны беспроводные");
    expect(html).toContain("9990.00");
    expect(html).toContain("Войдите, чтобы забронировать доступное желание.");
    expect(html).toContain("Войти, чтобы забронировать");
    expect(html).not.toContain("Забронировать</button>");
  });

  it("shows reserve controls for an authenticated non-owner viewer", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-2",
      email: "user@example.com",
    });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue({
      id: "wishlist-1",
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
      ],
      shareLink: {
        id: "share-1",
        token: "opaque-token",
      },
      viewer: {
        isAuthenticated: true,
        isOwner: false,
      },
    });

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({
      params: Promise.resolve({ token: "opaque-token" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Забронировать");
    expect(html).not.toContain("Уже забронировано");
  });

  it("blocks reserve controls for the wishlist owner", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "owner-1",
      email: "owner@example.com",
    });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue({
      id: "wishlist-1",
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
      ],
      shareLink: {
        id: "share-1",
        token: "opaque-token",
      },
      viewer: {
        isAuthenticated: true,
        isOwner: true,
      },
    });

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({
      params: Promise.resolve({ token: "opaque-token" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Это ваш вишлист. Бронировать собственные желания нельзя.");
    expect(html).not.toContain("Забронировать</button>");
  });

  it("shows reserved state instead of reserve controls for reserved items", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-2",
      email: "user@example.com",
    });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue({
      id: "wishlist-1",
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
            status: "reserved",
          },
        },
      ],
      shareLink: {
        id: "share-1",
        token: "opaque-token",
      },
      viewer: {
        isAuthenticated: true,
        isOwner: false,
      },
    });

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({
      params: Promise.resolve({ token: "opaque-token" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Уже забронировано");
    expect(html).not.toContain("Забронировать</button>");
  });

  it("renders success and error feedback for reserve flow", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-2",
      email: "user@example.com",
    });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue({
      id: "wishlist-1",
      items: [],
      shareLink: {
        id: "share-1",
        token: "opaque-token",
      },
      viewer: {
        isAuthenticated: true,
        isOwner: false,
      },
    });

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const successPage = await SharePage({
      params: Promise.resolve({ token: "opaque-token" }),
      searchParams: Promise.resolve({ status: "reservation-created" }),
    });
    const errorPage = await SharePage({
      params: Promise.resolve({ token: "opaque-token" }),
      searchParams: Promise.resolve({ action: "reserve", error: "already-reserved" }),
    });

    expect(renderToStaticMarkup(successPage)).toContain("Желание забронировано.");
    expect(renderToStaticMarkup(errorPage)).toContain("Это желание уже забронировано.");
  });
});
