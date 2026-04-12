import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { reservations } from "@/modules/reservation/db/schema";
import { wishlistItems } from "@/modules/wishlist/db/schema";

export type CurrentUserReservationItem = {
  id: string;
  wishlistId: string;
  title: string;
  url: string | null;
  note: string | null;
  price: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CurrentUserReservation = {
  id: string;
  createdAt: Date;
  item: CurrentUserReservationItem;
};

export async function listCurrentUserActiveReservations(
  userId: string,
): Promise<CurrentUserReservation[]> {
  const db = await getDb();
  const activeReservations = await db.query.reservations.findMany({
    columns: {
      id: true,
      wishlistItemId: true,
      createdAt: true,
    },
    where: and(eq(reservations.userId, userId), isNull(reservations.cancelledAt)),
    orderBy: [asc(reservations.createdAt), asc(reservations.id)],
  });

  if (activeReservations.length === 0) {
    return [];
  }

  const items = await db.query.wishlistItems.findMany({
    columns: {
      id: true,
      wishlistId: true,
      title: true,
      url: true,
      note: true,
      price: true,
      createdAt: true,
      updatedAt: true,
    },
    where: inArray(
      wishlistItems.id,
      activeReservations.map((reservation) => reservation.wishlistItemId),
    ),
    orderBy: [asc(wishlistItems.createdAt), asc(wishlistItems.id)],
  });

  const itemsById = new Map(items.map((item) => [item.id, item]));

  return activeReservations.flatMap((reservation) => {
    const item = itemsById.get(reservation.wishlistItemId);

    if (!item) {
      return [];
    }

    return {
      id: reservation.id,
      createdAt: reservation.createdAt,
      item,
    };
  });
}

async function getDb() {
  const { db } = await import("@/shared/db");

  return db;
}
