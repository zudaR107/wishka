import { redirect } from "next/navigation";

export async function reservePublicWishlistItemAction(formData: FormData) {
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
    redirect("/login");
  }

  const sharePath = buildSharePath(token);
  const publicWishlist = await getPublicWishlistViewByShareToken(token, user.id);

  if (!publicWishlist) {
    redirect(`${sharePath}?action=reserve&error=invalid-share`);
  }

  const matchingItem = publicWishlist.items.find((item) => item.id === itemId);

  if (!matchingItem) {
    redirect(`${sharePath}?action=reserve&error=invalid-share`);
  }

  const result = await createReservation(user.id, itemId);

  if (result.status === "success") {
    redirect(`${sharePath}?status=reservation-created`);
  }

  switch (result.code) {
    case "already-reserved":
      redirect(`${sharePath}?action=reserve&error=already-reserved`);
    case "own-item":
      redirect(`${sharePath}?action=reserve&error=own-item`);
    case "item-not-found":
      redirect(`${sharePath}?action=reserve&error=invalid-share`);
    default:
      redirect(`${sharePath}?action=reserve&error=unknown`);
  }
}

function buildSharePath(token: string): string {
  return `/share/${encodeURIComponent(token)}`;
}

function getFormValue(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}
