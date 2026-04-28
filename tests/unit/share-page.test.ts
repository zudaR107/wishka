import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getPublicWishlistViewByShareToken: vi.fn(),
  createReservation: vi.fn(),
  cancelReservation: vi.fn(),
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
  cancelReservation: mocks.cancelReservation,
}));

// Mock client components so server rendering works in unit tests.
vi.mock("../../src/app/share/[token]/share-reserve-button", () => ({
  ShareReserveButton: ({ reserveLabel }: { reserveLabel: string }) =>
    React.createElement(
      "form",
      null,
      React.createElement("button", { type: "submit" }, reserveLabel),
    ),
}));

vi.mock("../../src/app/share/[token]/share-cancel-reservation-button", () => ({
  ShareCancelReservationButton: ({ cancelLabel }: { cancelLabel: string }) =>
    React.createElement(
      "form",
      null,
      React.createElement("button", { type: "submit" }, cancelLabel),
    ),
}));

// Helpers
function makeAvailableItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    wishlistId: "wishlist-1",
    title: "Наушники",
    url: null,
    note: null,
    price: null,
    starred: false,
    createdAt: new Date("2026-04-11T00:00:00.000Z"),
    updatedAt: new Date("2026-04-11T00:00:00.000Z"),
    reservation: { status: "available" as const },
    ...overrides,
  };
}

function makeReservedItem(
  isViewerReservation: boolean,
  overrides: Record<string, unknown> = {},
) {
  return {
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
      status: "reserved" as const,
      isViewerReservation,
      reservationId: "reservation-1",
    },
    ...overrides,
  };
}

function makeWishlistView(items: unknown[], viewerOverrides = {}) {
  return {
    id: "wishlist-1",
    items,
    shareLink: { id: "share-1", token: "opaque-token" },
    viewer: { isAuthenticated: true, isOwner: false, ...viewerOverrides },
    owner: { email: "owner@example.com", bio: null },
  };
}

describe("public share route rendering", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.getCurrentUser.mockReset();
    mocks.getPublicWishlistViewByShareToken.mockReset();
    mocks.createReservation.mockReset();
    mocks.cancelReservation.mockReset();
    mocks.getCurrentUser.mockResolvedValue(null);
  });

  it("renders an unavailable state for invalid or inactive tokens", async () => {
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(null);

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "missing-token" }) });
    const html = renderToStaticMarkup(page);

    expect(mocks.getPublicWishlistViewByShareToken).toHaveBeenCalledWith("missing-token", undefined);
    expect(html).toContain("Публичная ссылка недоступна");
    expect(html).toContain("Попросите владельца отправить актуальную ссылку.");
    expect(html).toContain("На главную");
    expect(html).not.toContain("Войти, чтобы забронировать");
  });

  it("renders the same unavailable state for revoked tokens", async () => {
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(null);

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "revoked-token" }) });
    const html = renderToStaticMarkup(page);

    expect(mocks.getPublicWishlistViewByShareToken).toHaveBeenCalledWith("revoked-token", undefined);
    expect(html).toContain("Публичная ссылка недоступна");
  });

  it("renders an empty public wishlist state when there are no items", async () => {
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(makeWishlistView([], { isAuthenticated: false }));

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "opaque-token" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Вишлист");
    expect(html).toContain("Этот вишлист пока пуст");
    expect(html).toContain("Владелец ещё не добавил сюда желания. Проверьте ссылку позже.");
  });

  it("shows a login prompt for guests without reserve controls", async () => {
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(
      makeWishlistView(
        [makeAvailableItem({ url: "https://example.com/item", note: "Нужны беспроводные", price: "9990" })],
        { isAuthenticated: false },
      ),
    );

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "opaque-token" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Вишлист");
    expect(html).toContain("Желания");
    expect(html).toContain("Наушники");
    expect(html).toContain("https://example.com/item");
    expect(html).toContain("Нужны беспроводные");
    expect(html).toContain("9 990");
    expect(html).toContain(
      "Войдите, чтобы забронировать доступное желание и потом управлять бронями в своём разделе.",
    );
    expect(html).toContain("Войти, чтобы забронировать");
    expect(html).not.toContain("Забронировать</button>");
  });

  it("shows the available status strip for available items", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "user@example.com" });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(
      makeWishlistView([makeAvailableItem()]),
    );

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "opaque-token" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("item-card-status-available");
    expect(html).toContain("Статус: доступно");
  });

  it("shows reserve controls for an authenticated non-owner viewer", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "user@example.com" });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(
      makeWishlistView([makeAvailableItem()]),
    );

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "opaque-token" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Забронировать");
    expect(html).not.toContain("Статус: забронировано");
  });

  it("shows reserve controls for the wishlist owner on their own share page", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "owner-1", email: "owner@example.com" });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(
      makeWishlistView([makeAvailableItem()], { isOwner: true }),
    );

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "opaque-token" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain(
      "Это ваш вишлист. Здесь можно проверить, как он выглядит, и забронировать свои желания.",
    );
    expect(html).toContain("Забронировать</button>");
  });

  it("shows reserved status strip and no controls when item is reserved by someone else", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "user@example.com" });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(
      makeWishlistView([makeReservedItem(false)]),
    );

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "opaque-token" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("item-card-status-reserved");
    expect(html).toContain("Статус: забронировано");
    expect(html).not.toContain("Забронировать</button>");
    expect(html).not.toContain("Отменить</button>");
  });

  it("shows self-reserved status strip and cancel button when item is reserved by the viewer", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "user@example.com" });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(
      makeWishlistView([makeReservedItem(true)]),
    );

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "opaque-token" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("item-card-status-self-reserved");
    expect(html).toContain("Статус: забронировано мной");
    expect(html).toContain("Отменить</button>");
    expect(html).not.toContain("Забронировать</button>");
  });

  it("shows owner email in header and bio card for authenticated viewers when bio is set", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "user@example.com" });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue({
      ...makeWishlistView([]),
      owner: { email: "owner@example.com", bio: "Люблю книги и путешествия" },
    });

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "opaque-token" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("owner@example.com");
    expect(html).toContain("Об авторе");
    expect(html).toContain("Люблю книги и путешествия");
  });

  it("shows owner email in header for guest viewers but hides bio card", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue({
      ...makeWishlistView([], { isAuthenticated: false }),
      owner: { email: "owner@example.com", bio: "Люблю книги и путешествия" },
    });

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "opaque-token" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("owner@example.com");
    expect(html).not.toContain("Об авторе");
    expect(html).not.toContain("Люблю книги и путешествия");
  });

  it("shows owner email in header but hides bio card when bio is null", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "user@example.com" });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(makeWishlistView([]));

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "opaque-token" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("owner@example.com");
    expect(html).not.toContain("Об авторе");
  });

  it("shows star icon for starred items", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "user@example.com" });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(
      makeWishlistView([makeAvailableItem({ starred: true })]),
    );

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "opaque-token" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("share-item-star");
    expect(html).toContain("Избранное");
  });
});

describe("reserveShareItemAction", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReset();
    mocks.getPublicWishlistViewByShareToken.mockReset();
    mocks.createReservation.mockReset();
    mocks.getCurrentUser.mockResolvedValue(null);
  });

  it("returns unauthenticated error when no user is logged in", async () => {
    const { reserveShareItemAction } = await import("../../src/app/share/[token]/actions");
    const formData = new FormData();
    formData.set("token", "opaque-token");
    formData.set("itemId", "item-1");

    const result = await reserveShareItemAction(null, formData);

    expect(result).toEqual({ status: "error", error: "unauthenticated" });
    expect(mocks.getPublicWishlistViewByShareToken).not.toHaveBeenCalled();
    expect(mocks.createReservation).not.toHaveBeenCalled();
  });

  it("returns success state when reservation is created", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "user@example.com" });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(
      makeWishlistView([makeAvailableItem()]),
    );
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

    const { reserveShareItemAction } = await import("../../src/app/share/[token]/actions");
    const formData = new FormData();
    formData.set("token", "opaque-token");
    formData.set("itemId", "item-1");

    const result = await reserveShareItemAction(null, formData);

    expect(result).toEqual({ status: "success" });
    expect(mocks.createReservation).toHaveBeenCalledWith("user-2", "item-1");
  });

  it("returns invalid-share error when share token is invalid", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "user@example.com" });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(null);

    const { reserveShareItemAction } = await import("../../src/app/share/[token]/actions");
    const formData = new FormData();
    formData.set("token", "opaque-token");
    formData.set("itemId", "item-1");

    const result = await reserveShareItemAction(null, formData);

    expect(result).toEqual({ status: "error", error: "invalid-share" });
    expect(mocks.createReservation).not.toHaveBeenCalled();
  });

  it("returns invalid-share error when item is not found in the wishlist", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "user@example.com" });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(makeWishlistView([]));

    const { reserveShareItemAction } = await import("../../src/app/share/[token]/actions");
    const formData = new FormData();
    formData.set("token", "opaque-token");
    formData.set("itemId", "item-1");

    const result = await reserveShareItemAction(null, formData);

    expect(result).toEqual({ status: "error", error: "invalid-share" });
    expect(mocks.createReservation).not.toHaveBeenCalled();
  });

  it("returns already-reserved error when the item is already taken", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "user@example.com" });
    mocks.getPublicWishlistViewByShareToken.mockResolvedValue(
      makeWishlistView([makeAvailableItem()]),
    );
    mocks.createReservation.mockResolvedValue({ status: "error", code: "already-reserved" });

    const { reserveShareItemAction } = await import("../../src/app/share/[token]/actions");
    const formData = new FormData();
    formData.set("token", "opaque-token");
    formData.set("itemId", "item-1");

    const result = await reserveShareItemAction(null, formData);

    expect(result).toEqual({ status: "error", error: "already-reserved" });
  });
});

describe("cancelShareReservationAction", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReset();
    mocks.cancelReservation.mockReset();
    mocks.getCurrentUser.mockResolvedValue(null);
  });

  it("returns unauthenticated error when no user is logged in", async () => {
    const { cancelShareReservationAction } = await import("../../src/app/share/[token]/actions");
    const formData = new FormData();
    formData.set("reservationId", "reservation-1");

    const result = await cancelShareReservationAction(null, formData);

    expect(result).toEqual({ status: "error", error: "unauthenticated" });
    expect(mocks.cancelReservation).not.toHaveBeenCalled();
  });

  it("returns success when reservation is cancelled", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "user@example.com" });
    mocks.cancelReservation.mockResolvedValue({ status: "success" });

    const { cancelShareReservationAction } = await import("../../src/app/share/[token]/actions");
    const formData = new FormData();
    formData.set("reservationId", "reservation-1");

    const result = await cancelShareReservationAction(null, formData);

    expect(result).toEqual({ status: "success" });
    expect(mocks.cancelReservation).toHaveBeenCalledWith("user-2", "reservation-1");
  });

  it("returns not-reservation-owner error when user does not own the reservation", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "user@example.com" });
    mocks.cancelReservation.mockResolvedValue({ status: "error", code: "not-reservation-owner" });

    const { cancelShareReservationAction } = await import("../../src/app/share/[token]/actions");
    const formData = new FormData();
    formData.set("reservationId", "reservation-1");

    const result = await cancelShareReservationAction(null, formData);

    expect(result).toEqual({ status: "error", error: "not-reservation-owner" });
  });
});
