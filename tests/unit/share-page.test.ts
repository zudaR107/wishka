import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getPublicWishlistViewByShareToken: vi.fn(),
  createReservation: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
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

vi.mock("../../src/modules/reservation/server/lifecycle", () => ({
  createReservation: mocks.createReservation,
}));

function expectRedirectCall(run: () => Promise<unknown>, url: string) {
  mocks.redirect.mockImplementationOnce((target: string) => {
    throw new Error(`REDIRECT:${target}`);
  });

  return expect(run()).rejects.toThrow(`REDIRECT:${url}`);
}

describe("public share route rendering", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.getCurrentUser.mockReset();
    mocks.getPublicWishlistViewByShareToken.mockReset();
    mocks.createReservation.mockReset();
    mocks.redirect.mockReset();
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
    expect(html).toContain("Эта ссылка недействительна, отключена или устарела.");
    expect(html).toContain("Попросите владельца отправить актуальную ссылку.");
    expect(html).toContain("На главную");
    expect(html).toContain("Войти, чтобы забронировать");
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
    expect(html).toContain("Эта ссылка недействительна, отключена или устарела.");
    expect(html).toContain("Попросите владельца отправить актуальную ссылку.");
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
    expect(html).toContain("Владелец ещё не добавил сюда желания. Проверьте ссылку позже.");
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
          price: "9990",
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
    expect(html).toContain("9990");
    expect(html).toContain(
      "Войдите, чтобы забронировать доступное желание и потом управлять бронями в своём разделе.",
    );
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

    expect(html).toContain(
      "Это ваш вишлист. Здесь можно только проверить, как он выглядит по публичной ссылке.",
    );
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

  it("redirects guests to login when reserve action is submitted", async () => {
    const { reservePublicWishlistItemAction } = await import("../../src/app/share/[token]/actions");
    const formData = new FormData();
    formData.set("token", "opaque-token");
    formData.set("itemId", "item-1");

    await expectRedirectCall(() => reservePublicWishlistItemAction(formData), "/login");
    expect(mocks.getPublicWishlistViewByShareToken).not.toHaveBeenCalled();
    expect(mocks.createReservation).not.toHaveBeenCalled();
  });

  it("creates a reservation for an eligible authenticated non-owner", async () => {
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
          reservation: { status: "available" },
        },
      ],
      shareLink: { id: "share-1", token: "opaque-token" },
      viewer: { isAuthenticated: true, isOwner: false },
    });
    mocks.createReservation.mockResolvedValue({
      status: "success",
      reservation: {
        id: "reservation-1",
        wishlistItemId: "item-1",
        userId: "user-2",
        cancelledAt: null,
        createdAt: new Date("2026-04-12T00:00:00.000Z"),
      },
    });

    const { reservePublicWishlistItemAction } = await import("../../src/app/share/[token]/actions");
    const formData = new FormData();
    formData.set("token", "opaque-token");
    formData.set("itemId", "item-1");

    await expectRedirectCall(
      () => reservePublicWishlistItemAction(formData),
      "/share/opaque-token?status=reservation-created",
    );
    expect(mocks.createReservation).toHaveBeenCalledWith("user-2", "item-1");
  });

  it("blocks reserve action for an invalid share or missing item context", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-2",
      email: "user@example.com",
    });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(null);

    const { reservePublicWishlistItemAction } = await import("../../src/app/share/[token]/actions");
    const formData = new FormData();
    formData.set("token", "opaque-token");
    formData.set("itemId", "item-1");

    await expectRedirectCall(
      () => reservePublicWishlistItemAction(formData),
      "/share/opaque-token?action=reserve&error=invalid-share",
    );
    expect(mocks.createReservation).not.toHaveBeenCalled();

    mocks.getPublicWishlistViewByShareToken.mockResolvedValueOnce({
      id: "wishlist-1",
      items: [],
      shareLink: { id: "share-1", token: "opaque-token" },
      viewer: { isAuthenticated: true, isOwner: false },
    });

    await expectRedirectCall(
      () => reservePublicWishlistItemAction(formData),
      "/share/opaque-token?action=reserve&error=invalid-share",
    );
    expect(mocks.createReservation).not.toHaveBeenCalled();
  });

  it("blocks reserve action for owner and already-reserved results", async () => {
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
          reservation: { status: "available" },
        },
      ],
      shareLink: { id: "share-1", token: "opaque-token" },
      viewer: { isAuthenticated: true, isOwner: false },
    });

    const { reservePublicWishlistItemAction } = await import("../../src/app/share/[token]/actions");

    const ownerFormData = new FormData();
    ownerFormData.set("token", "opaque-token");
    ownerFormData.set("itemId", "item-1");
    mocks.createReservation.mockResolvedValueOnce({ status: "error", code: "own-item" });

    await expectRedirectCall(
      () => reservePublicWishlistItemAction(ownerFormData),
      "/share/opaque-token?action=reserve&error=own-item",
    );

    const reservedFormData = new FormData();
    reservedFormData.set("token", "opaque-token");
    reservedFormData.set("itemId", "item-1");
    mocks.createReservation.mockResolvedValueOnce({ status: "error", code: "already-reserved" });

    await expectRedirectCall(
      () => reservePublicWishlistItemAction(reservedFormData),
      "/share/opaque-token?action=reserve&error=already-reserved",
    );
  });
});
