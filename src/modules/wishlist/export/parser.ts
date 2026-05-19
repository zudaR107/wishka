export type ParsedItem = {
  title: string;
  url: string | null;
  note: string | null;
  price: string | null;
  currency: string;
};

export type ParsedWishlist = {
  name: string;
  items: ParsedItem[];
};

export type ParseResult =
  | { ok: true; wishlists: ParsedWishlist[] }
  | { ok: false; error: "empty" | "invalid-format" | "no-wishlists" };

const EMPTY_MARKER = "—";
const HEADER_RE = /^#{1,2}\s+(.+)$/;
const ROW_RE = /^\|(.+)\|$/;
// Matches the separator row: | --- | --- | ...
const SEPARATOR_RE = /^\|[-| :]+\|$/;
const EXPECTED_HEADERS = ["Название", "Ссылка", "Заметка", "Цена", "Валюта"];

function unescape(raw: string): string {
  return raw.replace(/\\\|/g, "|").trim();
}

function nullIfEmpty(value: string): string | null {
  const v = unescape(value);
  return v === "" || v === EMPTY_MARKER ? null : v;
}

function splitRow(line: string): string[] {
  // Strip leading/trailing pipe then split
  return line.slice(1, -1).split("|");
}

/**
 * Parse a Markdown string produced by `formatWishlistsAsMarkdown` back into
 * structured data ready for import.
 *
 * The parser is strict about the table header but tolerant of extra whitespace,
 * trailing newlines, and empty wishlists (placeholder `—` rows are skipped).
 */
export function parseWishlistMarkdown(source: string): ParseResult {
  if (!source || source.trim() === "") {
    return { ok: false, error: "empty" };
  }

  const lines = source.split("\n");
  const wishlists: ParsedWishlist[] = [];
  let current: ParsedWishlist | null = null;
  let inTable = false;
  let headerValidated = false;

  for (const raw of lines) {
    const line = raw.trimEnd();

    // New wishlist section
    const headerMatch = HEADER_RE.exec(line);
    if (headerMatch) {
      // Only treat ## headings as wishlist sections (skip the # document title)
      if (line.startsWith("## ")) {
        if (current) wishlists.push(current);
        current = { name: headerMatch[1].trim(), items: [] };
        inTable = false;
        headerValidated = false;
      }
      continue;
    }

    if (!current) continue;

    // Table rows
    if (ROW_RE.test(line)) {
      if (SEPARATOR_RE.test(line)) {
        // separator row — skip
        inTable = true;
        continue;
      }

      const cols = splitRow(line);

      if (!headerValidated) {
        // Validate column headers
        const headers = cols.map((c) => c.trim());
        const valid = EXPECTED_HEADERS.every((h, i) => headers[i] === h);
        if (!valid) {
          return { ok: false, error: "invalid-format" };
        }
        headerValidated = true;
        inTable = true;
        continue;
      }

      if (!inTable) continue;
      if (cols.length < 5) continue;

      const title = nullIfEmpty(cols[0] ?? "");
      if (!title) continue; // placeholder empty row — skip

      const url = nullIfEmpty(cols[1] ?? "");
      const note = nullIfEmpty(cols[2] ?? "");
      const rawPrice = nullIfEmpty(cols[3] ?? "");
      const rawCurrency = (cols[4] ?? "").trim();

      const price = rawPrice !== null && /^\d+$/.test(rawPrice) ? rawPrice : null;
      const currency = /^[A-Z]{3}$/.test(rawCurrency) ? rawCurrency : "RUB";

      current.items.push({ title, url, note, price, currency });
    }
  }

  if (current) wishlists.push(current);

  if (wishlists.length === 0) {
    return { ok: false, error: "no-wishlists" };
  }

  return { ok: true, wishlists };
}
