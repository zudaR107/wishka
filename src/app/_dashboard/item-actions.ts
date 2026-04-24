"use server";

import { requireCurrentUser } from "@/modules/auth/server/current-user";
import { createCurrentWishlistItem } from "@/modules/wishlist/server/create-item";
import {
  toggleCurrentWishlistItemStarred,
  updateCurrentWishlistItem,
} from "@/modules/wishlist/server/manage-item";

export type ItemValues = {
  title: string;
  url: string;
  note: string;
  price: string;
};

export type ItemFormState = {
  status: "success" | "error";
  error?: string;
  key: number;
  values?: ItemValues;
} | null;

export type DeleteItemState = {
  status: "success" | "error";
  error?: string;
} | null;

export type ReserveItemState = {
  status: "success" | "error";
  error?: string;
} | null;

export type CancelItemReservationState = {
  status: "success" | "error";
  error?: string;
} | null;

export type RegenerateState = {
  status: "success" | "error";
} | null;

export type ToggleStarredState = {
  status: "success" | "error";
  starred?: boolean;
} | null;

export async function createItemAction(
  prev: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const values: ItemValues = {
    title: getString(formData, "title"),
    url: getString(formData, "url"),
    note: getString(formData, "note"),
    price: getString(formData, "price"),
  };

  const user = await requireCurrentUser();
  const result = await createCurrentWishlistItem(user.id, values);

  if (result.status === "success") {
    return { status: "success", key: (prev?.key ?? 0) + 1 };
  }

  return { status: "error", error: result.code, key: (prev?.key ?? 0) + 1, values };
}

export async function updateItemAction(
  prev: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const values: ItemValues = {
    title: getString(formData, "title"),
    url: getString(formData, "url"),
    note: getString(formData, "note"),
    price: getString(formData, "price"),
  };

  const user = await requireCurrentUser();
  const result = await updateCurrentWishlistItem(user.id, getString(formData, "itemId"), values);

  if (result.status === "success") {
    return { status: "success", key: (prev?.key ?? 0) + 1 };
  }

  return { status: "error", error: result.code, key: (prev?.key ?? 0) + 1, values };
}

export async function toggleStarredAction(
  _prev: ToggleStarredState,
  formData: FormData,
): Promise<ToggleStarredState> {
  const user = await requireCurrentUser();
  const itemId = getString(formData, "itemId");
  const result = await toggleCurrentWishlistItemStarred(user.id, itemId);

  if (result.status === "success") {
    return { status: "success", starred: result.starred };
  }

  return { status: "error" };
}

function getString(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}
