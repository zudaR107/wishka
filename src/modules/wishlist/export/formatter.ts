import type { WishlistWithItems } from "@/modules/wishlist/server/items";

const EMPTY = "—";

/** Escape pipe characters inside Markdown table cells. */
function cell(value: string | null | undefined): string {
  if (!value || value.trim() === "") return EMPTY;
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/**
 * Serialise one or more wishlists into a human-readable Markdown string
 * suitable for storage, sharing, or printing.
 *
 * The format is stable and can be round-tripped through `parseWishlistMarkdown`.
 */
export function formatWishlistsAsMarkdown(
  wishlists: WishlistWithItems[],
  ownerEmail: string,
  exportDate: string = new Date().toISOString().slice(0, 10),
): string {
  const lines: string[] = [];

  lines.push("# Wshka — Мои вишлисты");
  lines.push("");
  lines.push(`Владелец: ${ownerEmail}  `);
  lines.push(`Дата экспорта: ${exportDate}`);
  lines.push("");

  for (const wishlist of wishlists) {
    lines.push("---");
    lines.push("");
    lines.push(`## ${wishlist.name}`);
    lines.push("");
    lines.push("| Название | Ссылка | Заметка | Цена | Валюта |");
    lines.push("|----------|--------|---------|------|--------|");

    if (wishlist.items.length === 0) {
      lines.push(`| ${EMPTY} | ${EMPTY} | ${EMPTY} | ${EMPTY} | ${EMPTY} |`);
    } else {
      for (const item of wishlist.items) {
        const price = item.price ? String(item.price) : null;
        lines.push(
          `| ${cell(item.title)} | ${cell(item.url)} | ${cell(item.note)} | ${cell(price)} | ${item.currency} |`,
        );
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}
