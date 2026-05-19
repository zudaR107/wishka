import { describe, expect, it } from "vitest";
import { parseWishlistMarkdown } from "../../src/modules/wishlist/export/parser";
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
    title: "Книга",
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

// ── Error cases ──────────────────────────────────────────────────────────────

describe("parseWishlistMarkdown — error cases", () => {
  it("returns empty error for empty input", () => {
    expect(parseWishlistMarkdown("")).toEqual({ ok: false, error: "empty" });
    expect(parseWishlistMarkdown("   \n  ")).toEqual({ ok: false, error: "empty" });
  });

  it("returns no-wishlists error when no ## sections are found", () => {
    const result = parseWishlistMarkdown("# Just a title\n\nSome prose.");
    expect(result).toEqual({ ok: false, error: "no-wishlists" });
  });

  it("returns invalid-format when table headers do not match", () => {
    const md = `
## My list

| Name | Link | Note |
|------|------|------|
| Item |  |  |
`;
    expect(parseWishlistMarkdown(md)).toEqual({ ok: false, error: "invalid-format" });
  });
});

// ── Success cases ────────────────────────────────────────────────────────────

describe("parseWishlistMarkdown — success cases", () => {
  it("parses a single wishlist with one item", () => {
    const md = `
## День рождения

| Название | Ссылка | Заметка | Цена | Валюта |
|----------|--------|---------|------|--------|
| Книга | https://example.com | Издание 2023 | 800 | RUB |
`;
    const result = parseWishlistMarkdown(md);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.wishlists).toHaveLength(1);
    const [wl] = result.wishlists;
    expect(wl.name).toBe("День рождения");
    expect(wl.items).toHaveLength(1);
    const [item] = wl.items;
    expect(item.title).toBe("Книга");
    expect(item.url).toBe("https://example.com");
    expect(item.note).toBe("Издание 2023");
    expect(item.price).toBe("800");
    expect(item.currency).toBe("RUB");
  });

  it("parses multiple wishlists", () => {
    const md = `
## Первый

| Название | Ссылка | Заметка | Цена | Валюта |
|----------|--------|---------|------|--------|
| A | — | — | — | RUB |

---

## Второй

| Название | Ссылка | Заметка | Цена | Валюта |
|----------|--------|---------|------|--------|
| B | — | — | — | USD |
`;
    const result = parseWishlistMarkdown(md);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.wishlists).toHaveLength(2);
    expect(result.wishlists[0].name).toBe("Первый");
    expect(result.wishlists[1].name).toBe("Второй");
  });

  it("treats — as null for optional fields", () => {
    const md = `
## W

| Название | Ссылка | Заметка | Цена | Валюта |
|----------|--------|---------|------|--------|
| Item | — | — | — | RUB |
`;
    const result = parseWishlistMarkdown(md);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [item] = result.wishlists[0].items;
    expect(item.url).toBeNull();
    expect(item.note).toBeNull();
    expect(item.price).toBeNull();
  });

  it("skips placeholder rows (empty name / —)", () => {
    const md = `
## Empty list

| Название | Ссылка | Заметка | Цена | Валюта |
|----------|--------|---------|------|--------|
| — | — | — | — | — |
`;
    const result = parseWishlistMarkdown(md);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.wishlists[0].items).toHaveLength(0);
  });

  it("falls back to RUB for unrecognised currency codes", () => {
    const md = `
## W

| Название | Ссылка | Заметка | Цена | Валюта |
|----------|--------|---------|------|--------|
| Item | — | — | — | INVALID |
`;
    const result = parseWishlistMarkdown(md);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.wishlists[0].items[0].currency).toBe("RUB");
  });
});

// ── Round-trip ───────────────────────────────────────────────────────────────

describe("formatter → parser round-trip", () => {
  it("preserves all fields through a full export → import cycle", () => {
    const original: WishlistWithItems[] = [
      makeWishlist("День рождения", [
        makeItem({ title: "Наушники", url: "https://sony.com", note: "Чёрные", price: "15000", currency: "RUB" }),
        makeItem({ id: "i2", title: "Книга", url: null, note: null, price: null, currency: "RUB" }),
      ]),
      makeWishlist("Новогодний", [
        makeItem({ id: "i3", wishlistId: "w2", title: "Плед", url: null, note: null, price: "3000", currency: "EUR" }),
      ]),
    ];

    const md = formatWishlistsAsMarkdown(original, "test@example.com", "2026-05-19");
    const result = parseWishlistMarkdown(md);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.wishlists).toHaveLength(2);

    const [wl1, wl2] = result.wishlists;
    expect(wl1.name).toBe("День рождения");
    expect(wl1.items).toHaveLength(2);
    expect(wl1.items[0]).toMatchObject({
      title: "Наушники",
      url: "https://sony.com",
      note: "Чёрные",
      price: "15000",
      currency: "RUB",
    });
    expect(wl1.items[1]).toMatchObject({
      title: "Книга",
      url: null,
      note: null,
      price: null,
      currency: "RUB",
    });

    expect(wl2.name).toBe("Новогодний");
    expect(wl2.items[0]).toMatchObject({ title: "Плед", price: "3000", currency: "EUR" });
  });
});
