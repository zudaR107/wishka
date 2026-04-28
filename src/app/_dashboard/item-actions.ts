"use server";

import { requireCurrentUser } from "@/modules/auth/server/current-user";
import { createCurrentWishlistItem } from "@/modules/wishlist/server/create-item";
import {
  toggleCurrentWishlistItemStarred,
  updateCurrentWishlistItem,
} from "@/modules/wishlist/server/manage-item";
import {
  createWishlist,
  renameWishlist,
  deleteWishlist,
} from "@/modules/wishlist/server/current-wishlist";

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

export type CreateWishlistState = {
  status: "success" | "error";
  wishlistId?: string;
  error?: string;
} | null;

export type RenameWishlistState = {
  status: "success" | "error";
  error?: string;
} | null;

export type DeleteWishlistState = {
  status: "success" | "error";
  error?: string;
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
  const wishlistId = getString(formData, "wishlistId");
  const starred = formData.get("starred") === "true";
  const result = await createCurrentWishlistItem(user.id, wishlistId, values, starred);

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
  const wishlistId = getString(formData, "wishlistId");
  const result = await updateCurrentWishlistItem(
    user.id,
    wishlistId,
    getString(formData, "itemId"),
    values,
  );

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
  const wishlistId = getString(formData, "wishlistId");
  const itemId = getString(formData, "itemId");
  const result = await toggleCurrentWishlistItemStarred(user.id, wishlistId, itemId);

  if (result.status === "success") {
    return { status: "success", starred: result.starred };
  }

  return { status: "error" };
}

export async function createWishlistAction(
  _prev: CreateWishlistState,
  formData: FormData,
): Promise<CreateWishlistState> {
  const user = await requireCurrentUser();
  const name = getString(formData, "name");
  const result = await createWishlist(user.id, name);

  if (result.status === "success") {
    return { status: "success", wishlistId: result.wishlistId };
  }

  return { status: "error", error: result.code };
}

export async function renameWishlistAction(
  _prev: RenameWishlistState,
  formData: FormData,
): Promise<RenameWishlistState> {
  const user = await requireCurrentUser();
  const wishlistId = getString(formData, "wishlistId");
  const name = getString(formData, "name");
  const result = await renameWishlist(wishlistId, user.id, name);

  if (result.status === "success") {
    return { status: "success" };
  }

  return { status: "error", error: result.code };
}

export async function deleteWishlistAction(
  _prev: DeleteWishlistState,
  formData: FormData,
): Promise<DeleteWishlistState> {
  const user = await requireCurrentUser();
  const wishlistId = getString(formData, "wishlistId");
  const result = await deleteWishlist(wishlistId, user.id);

  if (result.status === "success") {
    return { status: "success" };
  }

  return { status: "error", error: result.code };
}

function getString(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}
