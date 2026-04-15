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

function normalizeOptionalField(value: string): string | null {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

function normalizePrice(value: string): NormalizedPriceResult {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { status: "success", value: null };
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return { status: "error", code: "invalid-price" };
  }

  return { status: "success", value: String(Math.round(parsedValue)) };
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
