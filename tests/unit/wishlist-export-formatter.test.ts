import { describe, expect, it } from "vitest";
import { formatWishlistsAsMarkdown } from "../../src/modules/wishlist/export/formatter";
import type { WishlistWithItems } from "../../src/modules/wishlist/server/items";

function makeWishlist(
  name: string,
  items: WishlistWithItems["items"] = [],
): WishlistWithItems {
  return {
    id: "w1",
    userId: "u1",
    name,
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    items,
  };
}

function makeItem(overrides: Partial<WishlistWithItems["items"][number]> = {}): WishlistWithItems["items"][number] {
  return {
    id: "i1",
    wishlistId: "w1",
    title: "Test item",
    url: null,
    note: null,
    price: null,
    currency: "RUB",
    starred: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("formatWishlistsAsMarkdown", () => {
  it("includes the document title, owner, and date", () => {
    const md = formatWishlistsAsMarkdown([], "user@example.com", "2026-05-19");
    expect(md).toContain("# Wshka — Мои вишлисты");
    expect(md).toContain("Владелец: user@example.com");
    expect(md).toContain("Дата экспорта: 2026-05-19");
  });

  it("creates a ## section per wishlist", () => {
    const wishlists = [makeWishlist("День рождения"), makeWishlist("Новогодний")];
    const md = formatWishlistsAsMarkdown(wishlists, "u@e.com", "2026-01-01");
    expect(md).toContain("## День рождения");
    expect(md).toContain("## Новогодний");
  });

  it("includes the table header row", () => {
    const md = formatWishlistsAsMarkdown([makeWishlist("Test")], "u@e.com", "2026-01-01");
    expect(md).toContain("| Название | Ссылка | Заметка | Цена | Валюта |");
  });

  it("renders item fields correctly", () => {
    const item = makeItem({
      title: "Книга",
      url: "https://example.com",
      note: "Издание 2023",
      price: "800",
      currency: "RUB",
    });
    const md = formatWishlistsAsMarkdown([makeWishlist("W", [item])], "u@e.com", "2026-01-01");
    expect(md).toContain("Книга");
    expect(md).toContain("https://example.com");
    expect(md).toContain("Издание 2023");
    expect(md).toContain("800");
    expect(md).toContain("RUB");
  });

  it("renders — for null fields", () => {
    const item = makeItem({ title: "Плед", url: null, note: null, price: null });
    const md = formatWishlistsAsMarkdown([makeWishlist("W", [item])], "u@e.com", "2026-01-01");
    // Three null fields rendered as —
    const matches = md.match(/—/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  it("escapes pipe characters in cell values", () => {
    const item = makeItem({ title: "A | B" });
    const md = formatWishlistsAsMarkdown([makeWishlist("W", [item])], "u@e.com", "2026-01-01");
    expect(md).toContain("A \\| B");
  });

  it("renders a placeholder row for an empty wishlist", () => {
    const md = formatWishlistsAsMarkdown([makeWishlist("Empty")], "u@e.com", "2026-01-01");
    const lines = md.split("\n");
    const dataRows = lines.filter(
      (l) => l.startsWith("|") && !l.includes("---") && !l.includes("Название"),
    );
    expect(dataRows.length).toBe(1);
    expect(dataRows[0]).toContain("—");
  });
});
