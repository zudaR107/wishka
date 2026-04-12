import { and, asc, eq } from "drizzle-orm";
import { DatabaseError } from "pg";
import { shareLinks } from "@/modules/share/db/schema";
import { generateShareToken } from "@/modules/share/server/token";
import {
  getCurrentWishlist,
  getOrCreateCurrentWishlist,
} from "@/modules/wishlist/server/current-wishlist";

const MAX_CREATE_SHARE_LINK_ATTEMPTS = 5;

export type CurrentShareLink = {
  id: string;
  wishlistId: string;
  token: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function getCurrentShareLink(userId: string): Promise<CurrentShareLink | null> {
  const wishlist = await getCurrentWishlist(userId);

  if (!wishlist) {
    return null;
  }

  return findActiveShareLinkByWishlistId(wishlist.id);
}

export async function getOrCreateCurrentShareLink(userId: string): Promise<CurrentShareLink> {
  const wishlist = await getOrCreateCurrentWishlist(userId);
  const currentShareLink = await findActiveShareLinkByWishlistId(wishlist.id);

  if (currentShareLink) {
    return currentShareLink;
  }

  return createActiveShareLink(wishlist.id);
}

async function createActiveShareLink(wishlistId: string): Promise<CurrentShareLink> {
  const db = await getDb();

  for (let attempt = 0; attempt < MAX_CREATE_SHARE_LINK_ATTEMPTS; attempt += 1) {
    try {
      const [createdShareLink] = await db
        .insert(shareLinks)
        .values({
          wishlistId,
          token: generateShareToken(),
          isActive: true,
        })
        .returning({
          id: shareLinks.id,
          wishlistId: shareLinks.wishlistId,
          token: shareLinks.token,
          isActive: shareLinks.isActive,
          createdAt: shareLinks.createdAt,
          updatedAt: shareLinks.updatedAt,
        });

      if (!createdShareLink) {
        throw new Error("Failed to create active share link.");
      }

      return createdShareLink;
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      const existingShareLink = await findActiveShareLinkByWishlistId(wishlistId);

      if (existingShareLink) {
        return existingShareLink;
      }
    }
  }

  throw new Error("Failed to create active share link.");
}

async function findActiveShareLinkByWishlistId(wishlistId: string): Promise<CurrentShareLink | null> {
  const db = await getDb();

  const activeShareLink = await db.query.shareLinks.findFirst({
    columns: {
      id: true,
      wishlistId: true,
      token: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    where: and(eq(shareLinks.wishlistId, wishlistId), eq(shareLinks.isActive, true)),
    orderBy: [asc(shareLinks.createdAt), asc(shareLinks.id)],
  });

  if (!activeShareLink || !activeShareLink.isActive) {
    return null;
  }

  return activeShareLink;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof DatabaseError && error.code === "23505";
}

async function getDb() {
  const { db } = await import("@/shared/db");

  return db;
}
