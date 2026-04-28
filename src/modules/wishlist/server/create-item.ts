import { wishlistItems } from "@/modules/wishlist/db/schema";
import { getWishlistForUser } from "@/modules/wishlist/server/current-wishlist";
import {
  type WishlistItemInput,
  type WishlistItemValidationErrorCode,
  validateWishlistItemInput,
} from "@/modules/wishlist/server/item-input";

export type CreateWishlistItemResult =
  | { status: "success" }
  | {
      status: "error";
      code: WishlistItemValidationErrorCode | "unknown";
    };

export function validateCreateWishlistItemInput(
  input: WishlistItemInput,
) {
  return validateWishlistItemInput(input);
}

export async function createCurrentWishlistItem(
  userId: string,
  wishlistId: string,
  input: WishlistItemInput,
  starred = false,
): Promise<CreateWishlistItemResult> {
  const validationResult = validateCreateWishlistItemInput(input);

  if (validationResult.status === "error") {
    return validationResult;
  }

  try {
    const wishlist = await getWishlistForUser(wishlistId, userId);

    if (!wishlist) {
      return { status: "error", code: "unknown" };
    }

    const db = await getDb();

    await db.insert(wishlistItems).values({
      wishlistId: wishlist.id,
      ...validationResult.values,
      starred,
    });

    return { status: "success" };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

async function getDb() {
  const { db } = await import("@/shared/db");

  return db;
}
