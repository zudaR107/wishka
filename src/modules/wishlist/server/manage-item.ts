import { and, eq, isNull } from "drizzle-orm";
import { reservations } from "@/modules/reservation/db/schema";
import { wishlistItems } from "@/modules/wishlist/db/schema";
import { getWishlistForUser } from "@/modules/wishlist/server/current-wishlist";
import {
  type WishlistItemInput,
  type WishlistItemValidationErrorCode,
  validateWishlistItemInput,
} from "@/modules/wishlist/server/item-input";
import { fanOutNotifications } from "@/modules/notification/server/create-notification";
import { deleteImageFile } from "@/modules/wishlist/server/item-image";

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
  wishlistId: string,
  itemId: string,
  input: WishlistItemInput,
): Promise<UpdateWishlistItemResult> {
  const validationResult = validateWishlistItemInput(input);

  if (validationResult.status === "error") {
    return validationResult;
  }

  try {
    const wishlist = await getWishlistForUser(wishlistId, userId);

    if (!wishlist) {
      return { status: "error", code: "item-not-found" };
    }

    const db = await getDb();
    const existing = await db.query.wishlistItems.findFirst({
      columns: { id: true, title: true, wishlistId: true },
      where: and(eq(wishlistItems.id, itemId), eq(wishlistItems.wishlistId, wishlist.id)),
    });

    if (!existing) {
      return { status: "error", code: "item-not-found" };
    }

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

    // Fan-out notifications to all active reservers (best-effort, non-blocking)
    void notifyReservers(db, itemId, existing.title, existing.wishlistId, "item_updated");

    return { status: "success" };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

export async function deleteCurrentWishlistItem(
  userId: string,
  wishlistId: string,
  itemId: string,
): Promise<DeleteWishlistItemResult> {
  try {
    const wishlist = await getWishlistForUser(wishlistId, userId);

    if (!wishlist) {
      return { status: "error", code: "item-not-found" };
    }

    const db = await getDb();

    // Snapshot item title, imageUrl, and reservers BEFORE deletion (cascade will remove them)
    const existing = await db.query.wishlistItems.findFirst({
      columns: { id: true, title: true, wishlistId: true, imageUrl: true },
      where: and(eq(wishlistItems.id, itemId), eq(wishlistItems.wishlistId, wishlist.id)),
    });

    if (!existing) {
      return { status: "error", code: "item-not-found" };
    }

    const activeReservers = await db
      .select({ userId: reservations.userId })
      .from(reservations)
      .where(and(eq(reservations.wishlistItemId, itemId), isNull(reservations.cancelledAt)));

    const result = await db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.id, itemId), eq(wishlistItems.wishlistId, wishlist.id)))
      .returning({ id: wishlistItems.id });

    if (result.length === 0) {
      return { status: "error", code: "item-not-found" };
    }

    // Best-effort cleanup of the associated image file.
    if (existing.imageUrl) {
      void deleteImageFile(existing.imageUrl);
    }

    // Fan-out notifications with itemId=null (item is now deleted)
    const reserverIds = activeReservers.map((r) => r.userId);
    void fanOutNotifications(reserverIds, {
      type: "item_deleted",
      itemId: null,
      itemTitle: existing.title,
      wishlistId: existing.wishlistId,
      shareToken: null,
    });

    return { status: "success" };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

export async function toggleCurrentWishlistItemStarred(
  userId: string,
  wishlistId: string,
  itemId: string,
): Promise<ToggleStarredResult> {
  try {
    const wishlist = await getWishlistForUser(wishlistId, userId);

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

async function notifyReservers(
  db: Awaited<ReturnType<typeof getDb>>,
  itemId: string,
  itemTitle: string,
  wishlistId: string,
  type: "item_updated" | "item_deleted",
): Promise<void> {
  const activeReservers = await db
    .select({ userId: reservations.userId })
    .from(reservations)
    .where(and(eq(reservations.wishlistItemId, itemId), isNull(reservations.cancelledAt)));

  const reserverIds = activeReservers.map((r) => r.userId);

  // Snapshot the active share token now so link regeneration revokes old links.
  let shareToken: string | null = null;
  if (type === "item_updated") {
    const { shareLinks } = await import("@/modules/share/db/schema");
    const link = await db.query.shareLinks.findFirst({
      columns: { token: true },
      where: and(eq(shareLinks.wishlistId, wishlistId), eq(shareLinks.isActive, true)),
    });
    shareToken = link?.token ?? null;
  }

  await fanOutNotifications(reserverIds, {
    type,
    itemId: type === "item_deleted" ? null : itemId,
    itemTitle,
    wishlistId,
    shareToken,
  });
}
