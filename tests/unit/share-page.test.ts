import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublicWishlistByShareToken: vi.fn(),
}));

vi.mock("../../src/modules/share", () => ({
  getPublicWishlistByShareToken: mocks.getPublicWishlistByShareToken,
}));

describe("public share route rendering", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.getPublicWishlistByShareToken.mockReset();
  });

  it("renders an unavailable state for invalid or inactive tokens", async () => {
    mocks.getPublicWishlistByShareToken.mockResolvedValue(null);

    const { default: SharePage } = await import("../../src/app/share/[token]/page");
    const page = await SharePage({
      params: Promise.resolve({ token: "missing-token" }),
    });
    const html = renderToStaticMarkup(page);

    expect(mocks.getPublicWishlistByShareToken).toHaveBeenCalledWith("missing-token");
    expect(html).toContain("Публичная ссылка недоступна");
    expect(html).toContain("Эта ссылка недействительна или больше неактивна.");
  });

  it("renders an empty public wishlist state when there are no items", async () => {
    mocks.getPublicWishlistByShareToken.mockResolvedValue({
      id: "wishlist-1",
      items: [],
      shareLink: {
        id: "share-1",
        token: "opaque-token",
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

  it("renders public wishlist items in read-only mode for a valid token", async () => {
    mocks.getPublicWishlistByShareToken.mockResolvedValue({
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
        },
      ],
      shareLink: {
        id: "share-1",
        token: "opaque-token",
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
    expect(html).not.toContain("Создать публичную ссылку");
    expect(html).not.toContain("Сохранить изменения");
  });
});
