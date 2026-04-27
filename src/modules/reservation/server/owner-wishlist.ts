import {
  getCurrentWishlistWithItems,
  getAllUserWishlistsWithItems,
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

export async function getAllOwnerWishlistsWithReservations(
  userId: string,
): Promise<OwnerWishlistWithReservations[]> {
  const allWishlists = await getAllUserWishlistsWithItems(userId);

  const allItemIds = allWishlists.flatMap((w) => w.items.map((i) => i.id));

  const activeReservations =
    allItemIds.length > 0 ? await listActiveReservationsByItemIds(allItemIds) : [];

  const activeReservationByItemId = new Map(
    activeReservations.map((r) => [r.wishlistItemId, r]),
  );

  return allWishlists.map((wishlist) => ({
    ...wishlist,
    items: wishlist.items.map((item) => {
      const reservation = activeReservationByItemId.get(item.id);

      if (!reservation) {
        return { ...item, reservation: { status: "available" as const } };
      }

      const isOwn = reservation.userId === userId;

      return {
        ...item,
        reservation: isOwn
          ? { status: "reserved" as const, isOwn: true, reservationId: reservation.id }
          : { status: "reserved" as const, isOwn: false },
      };
    }),
  }));
}

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
