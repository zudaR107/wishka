import { and, eq } from "drizzle-orm";
import { wishlistItems } from "@/modules/wishlist/db/schema";
import { getCurrentWishlist } from "@/modules/wishlist/server/current-wishlist";
import {
  type WishlistItemInput,
  type WishlistItemValidationErrorCode,
  validateWishlistItemInput,
} from "@/modules/wishlist/server/item-input";

export type UpdateWishlistItemResult =
  | { status: "success" }
  | { status: "error"; code: WishlistItemValidationErrorCode | "item-not-found" | "unknown" };

export type DeleteWishlistItemResult =
  | { status: "success" }
  | { status: "error"; code: "item-not-found" | "unknown" };

export type ToggleStarredResult =
  | { status: "success"; starred: boolean }
  | { status: "error"; code: "item-not-found" | "unknown" };

export async function updateCurrentWishlistItem(
  userId: string,
  itemId: string,
  input: WishlistItemInput,
): Promise<UpdateWishlistItemResult> {
  const validationResult = validateWishlistItemInput(input);

  if (validationResult.status === "error") {
    return validationResult;
  }

  try {
    const wishlist = await getCurrentWishlist(userId);

    if (!wishlist) {
      return { status: "error", code: "item-not-found" };
    }

    const db = await getDb();
    const result = await db
      .update(wishlistItems)
      .set({
        ...validationResult.values,
        updatedAt: new Date(),
      })
      .where(and(eq(wishlistItems.id, itemId), eq(wishlistItems.wishlistId, wishlist.id)))
      .returning({ id: wishlistItems.id });

    if (result.length === 0) {
      return { status: "error", code: "item-not-found" };
    }

    return { status: "success" };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

export async function deleteCurrentWishlistItem(
  userId: string,
  itemId: string,
): Promise<DeleteWishlistItemResult> {
  try {
    const wishlist = await getCurrentWishlist(userId);

    if (!wishlist) {
      return { status: "error", code: "item-not-found" };
    }

    const db = await getDb();
    const result = await db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.id, itemId), eq(wishlistItems.wishlistId, wishlist.id)))
      .returning({ id: wishlistItems.id });

    if (result.length === 0) {
      return { status: "error", code: "item-not-found" };
    }

    return { status: "success" };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

export async function toggleCurrentWishlistItemStarred(
  userId: string,
  itemId: string,
): Promise<ToggleStarredResult> {
  try {
    const wishlist = await getCurrentWishlist(userId);

    if (!wishlist) {
      return { status: "error", code: "item-not-found" };
    }

    const db = await getDb();

    const existing = await db.query.wishlistItems.findFirst({
      columns: { id: true, starred: true },
      where: and(eq(wishlistItems.id, itemId), eq(wishlistItems.wishlistId, wishlist.id)),
    });

    if (!existing) {
      return { status: "error", code: "item-not-found" };
    }

    const newStarred = !existing.starred;

    await db
      .update(wishlistItems)
      .set({ starred: newStarred, updatedAt: new Date() })
      .where(and(eq(wishlistItems.id, itemId), eq(wishlistItems.wishlistId, wishlist.id)));

    return { status: "success", starred: newStarred };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

async function getDb() {
  const { db } = await import("@/shared/db");

  return db;
}
