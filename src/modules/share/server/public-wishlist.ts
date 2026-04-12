import { and, eq } from "drizzle-orm";
import { shareLinks } from "@/modules/share/db/schema";
import { type CurrentShareLink } from "@/modules/share/server/current-share-link";
import {
  getWishlistWithItems,
  type WishlistItemRecord,
} from "@/modules/wishlist/server/items";

export type PublicWishlist = {
  id: string;
  items: WishlistItemRecord[];
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
  const shareLink = await getActiveShareLinkByToken(token);

  if (!shareLink) {
    return null;
  }

  const wishlist = await getWishlistWithItems(shareLink.wishlistId);

  if (!wishlist) {
    return null;
  }

  return {
    id: wishlist.id,
    items: wishlist.items,
    shareLink: {
      id: shareLink.id,
      token: shareLink.token,
    },
  };
}

async function getDb() {
  const { db } = await import("@/shared/db");

  return db;
}
