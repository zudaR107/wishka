import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { wishlistItems, wishlists } from "@/modules/wishlist/db/schema";

/**
 * Resolved at runtime so tests can override via process.env.
 * In development: ./public/uploads (served by Next.js static file handler).
 * In production:  /uploads        (served by Caddy as static files).
 */
function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");
}

const UPLOAD_URL_PREFIX = "/uploads";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** Max raw upload size enforced on the server (8 MB). */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type UploadItemImageResult =
  | { status: "success"; imageUrl: string }
  | { status: "error"; code: "item-not-found" | "invalid-type" | "too-large" | "unknown" };

export type DeleteItemImageResult =
  | { status: "success" }
  | { status: "error"; code: "item-not-found" | "unknown" };

/** Upload an image for an item. Verifies ownership, replaces any existing image. */
export async function uploadItemImage(
  userId: string,
  itemId: string,
  file: File,
): Promise<UploadItemImageResult> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { status: "error", code: "invalid-type" };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { status: "error", code: "too-large" };
  }

  try {
    const db = await getDb();

    const row = await db
      .select({
        id: wishlistItems.id,
        imageUrl: wishlistItems.imageUrl,
        ownerId: wishlists.userId,
      })
      .from(wishlistItems)
      .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
      .where(eq(wishlistItems.id, itemId))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!row || row.ownerId !== userId) {
      return { status: "error", code: "item-not-found" };
    }

    const uploadDir = getUploadDir();
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = mimeToExt(file.type);
    const filename = `${randomUUID()}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const imageUrl = `${UPLOAD_URL_PREFIX}/${filename}`;

    // Best-effort cleanup of the old image before updating DB.
    if (row.imageUrl) {
      void deleteImageFile(row.imageUrl);
    }

    await db
      .update(wishlistItems)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(wishlistItems.id, itemId));

    return { status: "success", imageUrl };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

/** Delete an item's image from disk and clear the column. Verifies ownership. */
export async function deleteItemImage(
  userId: string,
  itemId: string,
): Promise<DeleteItemImageResult> {
  try {
    const db = await getDb();

    const row = await db
      .select({
        id: wishlistItems.id,
        imageUrl: wishlistItems.imageUrl,
        ownerId: wishlists.userId,
      })
      .from(wishlistItems)
      .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
      .where(eq(wishlistItems.id, itemId))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!row || row.ownerId !== userId) {
      return { status: "error", code: "item-not-found" };
    }

    if (row.imageUrl) {
      void deleteImageFile(row.imageUrl);
    }

    await db
      .update(wishlistItems)
      .set({ imageUrl: null, updatedAt: new Date() })
      .where(eq(wishlistItems.id, itemId));

    return { status: "success" };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

/**
 * Remove a file from disk given its public URL path (/uploads/<filename>).
 * Best-effort — errors are silently swallowed by the caller.
 */
export async function deleteImageFile(imageUrl: string): Promise<void> {
  const filename = path.basename(imageUrl);
  if (!filename) return;
  const filePath = path.join(getUploadDir(), filename);
  await fs.unlink(filePath).catch(() => {});
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

async function getDb() {
  const { db } = await import("@/shared/db");
  return db;
}
