export type ReserveShareItemState = {
  status: "success" | "error";
  error?: string;
} | null;

export type CancelShareReservationState = {
  status: "success" | "error";
  error?: string;
} | null;

export async function reserveShareItemAction(
  _prev: ReserveShareItemState,
  formData: FormData,
): Promise<ReserveShareItemState> {
  "use server";

  const [{ getCurrentUser }, { createReservation }, { getPublicWishlistViewByShareToken }] =
    await Promise.all([
      import("@/modules/auth/server/current-user"),
      import("@/modules/reservation/server/lifecycle"),
      import("@/modules/share/server/public-wishlist"),
    ]);

  const user = await getCurrentUser();
  const token = getFormValue(formData, "token").trim();
  const itemId = getFormValue(formData, "itemId").trim();

  if (!user) {
    return { status: "error", error: "unauthenticated" };
  }

  const publicWishlist = await getPublicWishlistViewByShareToken(token, user.id);

  if (!publicWishlist) {
    return { status: "error", error: "invalid-share" };
  }

  const matchingItem = publicWishlist.items.find((item) => item.id === itemId);

  if (!matchingItem) {
    return { status: "error", error: "invalid-share" };
  }

  const result = await createReservation(user.id, itemId);

  if (result.status === "success") {
    return { status: "success" };
  }

  switch (result.code) {
    case "already-reserved":
      return { status: "error", error: "already-reserved" };
    case "item-not-found":
      return { status: "error", error: "invalid-share" };
    default:
      return { status: "error", error: "unknown" };
  }
}

export async function cancelShareReservationAction(
  _prev: CancelShareReservationState,
  formData: FormData,
): Promise<CancelShareReservationState> {
  "use server";

  const [{ getCurrentUser }, { cancelReservation }] = await Promise.all([
    import("@/modules/auth/server/current-user"),
    import("@/modules/reservation/server/lifecycle"),
  ]);

  const user = await getCurrentUser();
  const reservationId = getFormValue(formData, "reservationId").trim();

  if (!user) {
    return { status: "error", error: "unauthenticated" };
  }

  const result = await cancelReservation(user.id, reservationId);

  if (result.status === "success") {
    return { status: "success" };
  }

  switch (result.code) {
    case "not-reservation-owner":
      return { status: "error", error: "not-reservation-owner" };
    case "reservation-not-found":
      return { status: "error", error: "reservation-not-found" };
    default:
      return { status: "error", error: "unknown" };
  }
}

function getFormValue(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value : "";
}
