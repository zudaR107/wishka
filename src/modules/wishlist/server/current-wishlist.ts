import { and, asc, eq } from "drizzle-orm";
import { wishlists } from "@/modules/wishlist/db/schema";

export type CurrentWishlist = {
  id: string;
  userId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function getCurrentWishlist(userId: string): Promise<CurrentWishlist | null> {
  return findCurrentWishlist(userId);
}

export async function getOrCreateCurrentWishlist(userId: string): Promise<CurrentWishlist> {
  const currentWishlist = await findCurrentWishlist(userId);

  if (currentWishlist) {
    return currentWishlist;
  }

  const db = await getDb();
  const [createdWishlist] = await db
    .insert(wishlists)
    .values({
      userId,
      isActive: true,
    })
    .returning({
      id: wishlists.id,
      userId: wishlists.userId,
      isActive: wishlists.isActive,
      createdAt: wishlists.createdAt,
      updatedAt: wishlists.updatedAt,
    });

  if (!createdWishlist) {
    throw new Error("Failed to create current wishlist.");
  }

  return createdWishlist;
}

async function findCurrentWishlist(userId: string): Promise<CurrentWishlist | null> {
  const db = await getDb();

  const activeWishlist = await db.query.wishlists.findFirst({
    columns: {
      id: true,
      userId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    where: and(eq(wishlists.userId, userId), eq(wishlists.isActive, true)),
    orderBy: [asc(wishlists.createdAt)],
  });

  if (activeWishlist) {
    return activeWishlist;
  }

  const existingWishlist = await db.query.wishlists.findFirst({
    columns: {
      id: true,
      userId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    where: eq(wishlists.userId, userId),
    orderBy: [asc(wishlists.createdAt)],
  });

  return existingWishlist ?? null;
}

async function getDb() {
  const { db } = await import("@/shared/db");

  return db;
}
