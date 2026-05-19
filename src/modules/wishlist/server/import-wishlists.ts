import { parseWishlistMarkdown } from "@/modules/wishlist/export/parser";
import { createWishlist } from "@/modules/wishlist/server/current-wishlist";
import { wishlistItems } from "@/modules/wishlist/db/schema";

export type ImportWishlistsResult =
  | { status: "success"; wishlists: number; items: number }
  | { status: "error"; code: "empty" | "invalid-format" | "no-wishlists" | "unknown" };

/**
 * Parse a Markdown backup file and create the contained wishlists and items
 * for the given user. Existing data is never overwritten or merged.
 *
 * If a wishlist name collides with an existing one, a numeric suffix is
 * appended until a unique name is found (e.g. "My list (2)").
 */
export async function importWishlistsForUser(
  userId: string,
  markdownText: string,
): Promise<ImportWishlistsResult> {
  const parsed = parseWishlistMarkdown(markdownText);

  if (!parsed.ok) {
    return { status: "error", code: parsed.error };
  }

  try {
    const db = await getDb();
    let wishlistsCreated = 0;
    let itemsCreated = 0;

    for (const parsedWishlist of parsed.wishlists) {
      // Find a unique name for this wishlist
      let name = parsedWishlist.name;
      let attempt = 0;
      let wishlistId: string | null = null;

      while (wishlistId === null) {
        const candidateName = attempt === 0 ? name : `${parsedWishlist.name} (${attempt + 1})`;
        const result = await createWishlist(userId, candidateName);

        if (result.status === "success") {
          wishlistId = result.wishlistId;
        } else if (result.code === "duplicate") {
          attempt++;
          if (attempt > 99) {
            // Safety valve — should never happen in practice
            return { status: "error", code: "unknown" };
          }
        } else {
          return { status: "error", code: "unknown" };
        }
      }

      wishlistsCreated++;

      // Insert items directly — they come from a trusted export, so we skip
      // the heavy validation layer and only sanitise the minimum required.
      const itemValues = parsedWishlist.items
        .filter((item) => item.title.trim() !== "")
        .map((item) => ({
          wishlistId,
          title: item.title.slice(0, 255),
          url: item.url ? item.url.slice(0, 2048) : null,
          note: item.note ?? null,
          price: item.price ?? null,
          currency: item.currency,
        }));

      if (itemValues.length > 0) {
        await db.insert(wishlistItems).values(itemValues);
        itemsCreated += itemValues.length;
      }
    }

    return { status: "success", wishlists: wishlistsCreated, items: itemsCreated };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

async function getDb() {
  const { db } = await import("@/shared/db");
  return db;
}
