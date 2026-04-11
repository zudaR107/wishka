import { wishlistItems } from "@/modules/wishlist/db/schema";
import { getOrCreateCurrentWishlist } from "@/modules/wishlist/server/current-wishlist";

type CreateWishlistItemInput = {
  title: string;
  url: string;
  note: string;
  price: string;
};

type CreateWishlistItemValues = {
  title: string;
  url: string | null;
  note: string | null;
  price: string | null;
};

type ValidCreateWishlistItemInput = {
  status: "valid";
  values: CreateWishlistItemValues;
};

type NormalizedPriceResult =
  | { status: "success"; value: string | null }
  | { status: "error"; code: "invalid-price" };

export type CreateWishlistItemResult =
  | { status: "success" }
  | {
      status: "error";
      code: "invalid-title" | "invalid-url" | "invalid-price" | "unknown";
    };

type CreateWishlistItemValidationError = {
  status: "error";
  code: "invalid-title" | "invalid-url" | "invalid-price";
};

export function validateCreateWishlistItemInput(
  input: CreateWishlistItemInput,
): ValidCreateWishlistItemInput | CreateWishlistItemValidationError {
  const title = input.title.trim();
  const url = normalizeOptionalField(input.url);
  const note = normalizeOptionalField(input.note);
  const priceResult = normalizePrice(input.price);

  if (!title) {
    return { status: "error", code: "invalid-title" };
  }

  if (url && !isValidHttpUrl(url)) {
    return { status: "error", code: "invalid-url" };
  }

  if (priceResult.status === "error") {
    return priceResult;
  }

  return {
    status: "valid",
    values: {
      title,
      url,
      note,
      price: priceResult.value,
    },
  };
}

export async function createCurrentWishlistItem(
  userId: string,
  input: CreateWishlistItemInput,
): Promise<CreateWishlistItemResult> {
  const validationResult = validateCreateWishlistItemInput(input);

  if (validationResult.status === "error") {
    return validationResult;
  }

  try {
    const wishlist = await getOrCreateCurrentWishlist(userId);
    const db = await getDb();

    await db.insert(wishlistItems).values({
      wishlistId: wishlist.id,
      ...validationResult.values,
    });

    return { status: "success" };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

function normalizeOptionalField(value: string): string | null {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

function normalizePrice(
  value: string,
): NormalizedPriceResult {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { status: "success", value: null };
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return { status: "error", code: "invalid-price" };
  }

  return { status: "success", value: parsedValue.toFixed(2) };
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function getDb() {
  const { db } = await import("@/shared/db");

  return db;
}
