import { parseCurrency } from "@/shared/lib/currency";

export const MAX_PRICE = 999_999_999_999;

export type WishlistItemInput = {
  title: string;
  url: string;
  note: string;
  price: string;
  currency?: string;
};

export type WishlistItemValues = {
  title: string;
  url: string | null;
  note: string | null;
  price: string | null;
  currency: string;
};

export type WishlistItemValidationErrorCode =
  | "invalid-title"
  | "invalid-url"
  | "invalid-price";

export type ValidWishlistItemInput = {
  status: "valid";
  values: WishlistItemValues;
};

export type WishlistItemValidationError = {
  status: "error";
  code: WishlistItemValidationErrorCode;
};

type NormalizedPriceResult =
  | { status: "success"; value: string | null }
  | { status: "error"; code: "invalid-price" };

export function validateWishlistItemInput(
  input: WishlistItemInput,
): ValidWishlistItemInput | WishlistItemValidationError {
  const title = input.title.trim();
  const rawUrl = normalizeOptionalField(input.url);
  const url = rawUrl ? prependProtocol(rawUrl) : null;
  const note = normalizeOptionalField(input.note);
  const priceResult = normalizePrice(input.price);
  const currency = parseCurrency(input.currency);

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
      currency,
    },
  };
}

function normalizeOptionalField(value: string): string | null {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function normalizePrice(value: string): NormalizedPriceResult {
  const trimmed = value.trim();

  // Empty input → no price
  if (!trimmed) {
    return { status: "success", value: null };
  }

  // Strip display formatting only: spaces, NBSP, and known currency symbols.
  const stripped = trimmed.replace(/[\s ₽$€£¥]/g, "");

  // After stripping, must be purely digits — anything else (minus, letters, etc.) is invalid.
  if (!/^\d+$/.test(stripped)) {
    return { status: "error", code: "invalid-price" };
  }

  const parsedValue = Number(stripped);

  if (!Number.isFinite(parsedValue) || parsedValue > MAX_PRICE) {
    return { status: "error", code: "invalid-price" };
  }

  return { status: "success", value: String(parsedValue) };
}

function prependProtocol(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}
