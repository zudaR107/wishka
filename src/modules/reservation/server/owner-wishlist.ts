import {
  getCurrentWishlistWithItems,
  type WishlistWithItems,
} from "@/modules/wishlist/server/items";
import { listActiveReservationsByItemIds } from "@/modules/reservation/server/lifecycle";

export type OwnerWishlistItemReservation =
  | { status: "available" }
  | { status: "reserved"; isOwn: false }
  | { status: "reserved"; isOwn: true; reservationId: string };

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
  const activeReservations = await listActiveReservationsByItemIds(
    wishlist.items.map((item) => item.id),
  );
  const activeReservationByItemId = new Map(
    activeReservations.map((r) => [r.wishlistItemId, r]),
  );

  return {
    ...wishlist,
    items: wishlist.items.map((item) => {
      const reservation = activeReservationByItemId.get(item.id);

      if (!reservation) {
        return { ...item, reservation: { status: "available" } };
      }

      const isOwn = reservation.userId === userId;

      return {
        ...item,
        reservation: isOwn
          ? { status: "reserved", isOwn: true, reservationId: reservation.id }
          : { status: "reserved", isOwn: false },
      };
    }),
  };
}
