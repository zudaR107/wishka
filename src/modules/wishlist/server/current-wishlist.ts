import { and, asc, eq } from "drizzle-orm";
import { wishlists } from "@/modules/wishlist/db/schema";

export type CurrentWishlist = {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateWishlistResult =
  | { status: "success"; wishlistId: string }
  | { status: "error"; code: "unknown" };

export type RenameWishlistResult =
  | { status: "success" }
  | { status: "error"; code: "not-found" | "unknown" };

export type DeleteWishlistResult =
  | { status: "success" }
  | { status: "error"; code: "last-wishlist" | "not-found" | "unknown" };

export async function getCurrentWishlist(userId: string): Promise<CurrentWishlist | null> {
  return findCurrentWishlist(userId);
}

export async function getOrCreateCurrentWishlist(
  userId: string,
  name = "Мой список",
): Promise<CurrentWishlist> {
  const currentWishlist = await findCurrentWishlist(userId);

  if (currentWishlist) {
    return currentWishlist;
  }

  const db = await getDb();
  const [createdWishlist] = await db
    .insert(wishlists)
    .values({ userId, name, isActive: true })
    .returning({
      id: wishlists.id,
      userId: wishlists.userId,
      name: wishlists.name,
      isActive: wishlists.isActive,
      createdAt: wishlists.createdAt,
      updatedAt: wishlists.updatedAt,
    });

  if (!createdWishlist) {
    throw new Error("Failed to create current wishlist.");
  }

  return createdWishlist;
}

export async function getWishlistForUser(
  wishlistId: string,
  userId: string,
): Promise<CurrentWishlist | null> {
  const db = await getDb();
  const wishlist = await db.query.wishlists.findFirst({
    columns: {
      id: true,
      userId: true,
      name: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    where: and(eq(wishlists.id, wishlistId), eq(wishlists.userId, userId)),
  });
  return wishlist ?? null;
}

export async function getUserWishlists(userId: string): Promise<CurrentWishlist[]> {
  const db = await getDb();
  return db.query.wishlists.findMany({
    columns: {
      id: true,
      userId: true,
      name: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    where: eq(wishlists.userId, userId),
    orderBy: [asc(wishlists.createdAt)],
  });
}

export async function createWishlist(
  userId: string,
  name: string,
): Promise<CreateWishlistResult> {
  try {
    const db = await getDb();
    const [created] = await db
      .insert(wishlists)
      .values({ userId, name: name.trim() || "Мой список", isActive: true })
      .returning({ id: wishlists.id });

    if (!created) {
      return { status: "error", code: "unknown" };
    }

    return { status: "success", wishlistId: created.id };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

export async function renameWishlist(
  wishlistId: string,
  userId: string,
  name: string,
): Promise<RenameWishlistResult> {
  try {
    const db = await getDb();
    const result = await db
      .update(wishlists)
      .set({ name: name.trim() || "Мой список", updatedAt: new Date() })
      .where(and(eq(wishlists.id, wishlistId), eq(wishlists.userId, userId)))
      .returning({ id: wishlists.id });

    if (result.length === 0) {
      return { status: "error", code: "not-found" };
    }

    return { status: "success" };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

export async function deleteWishlist(
  wishlistId: string,
  userId: string,
): Promise<DeleteWishlistResult> {
  try {
    const db = await getDb();

    // Guard: cannot delete the last wishlist
    const userWishlists = await db.query.wishlists.findMany({
      columns: { id: true },
      where: eq(wishlists.userId, userId),
    });

    if (userWishlists.length <= 1) {
      return { status: "error", code: "last-wishlist" };
    }

    const result = await db
      .delete(wishlists)
      .where(and(eq(wishlists.id, wishlistId), eq(wishlists.userId, userId)))
      .returning({ id: wishlists.id });

    if (result.length === 0) {
      return { status: "error", code: "not-found" };
    }

    return { status: "success" };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

async function findCurrentWishlist(userId: string): Promise<CurrentWishlist | null> {
  const db = await getDb();

  const activeWishlist = await db.query.wishlists.findFirst({
    columns: {
      id: true,
      userId: true,
      name: true,
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
      name: true,
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
