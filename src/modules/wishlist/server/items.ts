import { asc, desc, eq } from "drizzle-orm";
import { wishlistItems, wishlists } from "@/modules/wishlist/db/schema";
import {
  type CurrentWishlist,
  getOrCreateCurrentWishlist,
} from "@/modules/wishlist/server/current-wishlist";

export type WishlistItemRecord = {
  id: string;
  wishlistId: string;
  title: string;
  url: string | null;
  note: string | null;
  price: string | null;
  starred: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type WishlistWithItems = CurrentWishlist & {
  items: WishlistItemRecord[];
};

export async function listWishlistItems(wishlistId: string): Promise<WishlistItemRecord[]> {
  const db = await getDb();

  return db.query.wishlistItems.findMany({
    columns: {
      id: true,
      wishlistId: true,
      title: true,
      url: true,
      note: true,
      price: true,
      starred: true,
      createdAt: true,
      updatedAt: true,
    },
    where: eq(wishlistItems.wishlistId, wishlistId),
    orderBy: [desc(wishlistItems.starred), asc(wishlistItems.createdAt), asc(wishlistItems.id)],
  });
}

export async function getWishlistWithItems(wishlistId: string): Promise<WishlistWithItems | null> {
  const db = await getDb();

  const wishlist = await db.query.wishlists.findFirst({
    columns: {
      id: true,
      userId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    where: eq(wishlists.id, wishlistId),
  });

  if (!wishlist) {
    return null;
  }

  const items = await listWishlistItems(wishlist.id);

  return {
    ...wishlist,
    items,
  };
}

export async function getCurrentWishlistWithItems(userId: string): Promise<WishlistWithItems> {
  const wishlist = await getOrCreateCurrentWishlist(userId);
  const items = await listWishlistItems(wishlist.id);

  return {
    ...wishlist,
    items,
  };
}

async function getDb() {
  const { db } = await import("@/shared/db");

  return db;
}
