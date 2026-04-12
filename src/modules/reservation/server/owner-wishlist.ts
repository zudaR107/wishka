import {
  getCurrentWishlistWithItems,
  type WishlistWithItems,
} from "@/modules/wishlist/server/items";
import { listActiveReservationsByItemIds } from "@/modules/reservation/server/lifecycle";

export type OwnerWishlistItemReservation = {
  status: "available" | "reserved";
};

export type OwnerWishlistItem = WishlistWithItems["items"][number] & {
  reservation: OwnerWishlistItemReservation;
};

export type OwnerWishlistWithReservations = Omit<WishlistWithItems, "items"> & {
  items: OwnerWishlistItem[];
};

export async function getCurrentOwnerWishlistWithReservations(
  userId: string,
): Promise<OwnerWishlistWithReservations> {
  const wishlist = await getCurrentWishlistWithItems(userId);
  const activeReservationItemIds = new Set(
    (await listActiveReservationsByItemIds(wishlist.items.map((item) => item.id))).map(
      (reservation) => reservation.wishlistItemId,
    ),
  );

  return {
    ...wishlist,
    items: wishlist.items.map((item) => ({
      ...item,
      reservation: {
        status: activeReservationItemIds.has(item.id) ? "reserved" : "available",
      },
    })),
  };
}
