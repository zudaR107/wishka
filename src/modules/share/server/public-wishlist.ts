import { and, eq } from "drizzle-orm";
import { listActiveReservationsByItemIds } from "@/modules/reservation";
import { shareLinks } from "@/modules/share/db/schema";
import { type CurrentShareLink } from "@/modules/share/server/current-share-link";
import {
  getWishlistWithItems,
  type WishlistItemRecord,
} from "@/modules/wishlist/server/items";

export type PublicWishlistItemReservation = {
  status: "available" | "reserved";
};

export type PublicWishlistItem = WishlistItemRecord & {
  reservation: PublicWishlistItemReservation;
};

export type PublicWishlist = {
  id: string;
  items: PublicWishlistItem[];
  shareLink: {
    id: string;
    token: string;
  };
};

export async function getActiveShareLinkByToken(token: string): Promise<CurrentShareLink | null> {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    return null;
  }

  const db = await getDb();

  return (
    (await db.query.shareLinks.findFirst({
      columns: {
        id: true,
        wishlistId: true,
        token: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      where: and(eq(shareLinks.token, normalizedToken), eq(shareLinks.isActive, true)),
    })) ?? null
  );
}

export async function getPublicWishlistByShareToken(token: string): Promise<PublicWishlist | null> {
  return getReservationAwarePublicWishlistByShareToken(token);
}

export async function getReservationAwarePublicWishlistByShareToken(
  token: string,
): Promise<PublicWishlist | null> {
  const shareLink = await getActiveShareLinkByToken(token);

  if (!shareLink) {
    return null;
  }

  const wishlist = await getWishlistWithItems(shareLink.wishlistId);

  if (!wishlist) {
    return null;
  }

  const activeReservationItemIds = new Set(
    (await listActiveReservationsByItemIds(wishlist.items.map((item) => item.id))).map(
      (reservation) => reservation.wishlistItemId,
    ),
  );

  const items = wishlist.items.map((item) => ({
    ...item,
    reservation: getPublicWishlistItemReservation(item.id, activeReservationItemIds),
  }));

  return {
    id: wishlist.id,
    items,
    shareLink: {
      id: shareLink.id,
      token: shareLink.token,
    },
  };
}

function getPublicWishlistItemReservation(
  itemId: string,
  activeReservationItemIds: Set<string>,
): PublicWishlistItemReservation {
  if (activeReservationItemIds.has(itemId)) {
    return { status: "reserved" };
  }

  return { status: "available" };
}

async function getDb() {
  const { db } = await import("@/shared/db");

  return db;
}
