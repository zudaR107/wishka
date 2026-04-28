export const MAX_PRICE = 999_999_999_999;

export type WishlistItemInput = {
  title: string;
  url: string;
  note: string;
  price: string;
};

export type WishlistItemValues = {
  title: string;
  url: string | null;
  note: string | null;
  price: string | null;
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

function normalizeOptionalField(value: string): string | null {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

function normalizePrice(value: string): NormalizedPriceResult {
  // Strip formatting characters added by PriceInput (NBSP, spaces, currency symbol).
  const trimmedValue = value.replace(/[  ₽]/g, "").trim();

  if (!trimmedValue) {
    return { status: "success", value: null };
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > MAX_PRICE) {
    return { status: "error", code: "invalid-price" };
  }

  return { status: "success", value: String(Math.round(parsedValue)) };
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
