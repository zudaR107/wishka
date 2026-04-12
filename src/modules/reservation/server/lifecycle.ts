import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { DatabaseError } from "pg";
import { reservations } from "@/modules/reservation/db/schema";
import { wishlistItems, wishlists } from "@/modules/wishlist/db/schema";

export type ActiveReservation = {
  id: string;
  wishlistItemId: string;
  userId: string;
  cancelledAt: null;
  createdAt: Date;
};

export type ReservationAvailability =
  | { status: "available" }
  | {
      status: "unavailable";
      code: "item-not-found" | "already-reserved";
    };

export type ReservationEligibility =
  | { status: "eligible" }
  | {
      status: "ineligible";
      code: "item-not-found" | "already-reserved" | "own-item";
    };

export type CreateReservationResult =
  | {
      status: "success";
      reservation: ActiveReservation;
    }
  | {
      status: "error";
      code: "item-not-found" | "already-reserved" | "own-item" | "unknown";
    };

export type CancelReservationResult =
  | { status: "success" }
  | {
      status: "error";
      code: "reservation-not-found" | "not-reservation-owner" | "unknown";
    };

type ReservationRecord = {
  id: string;
  wishlistItemId: string;
  userId: string;
  cancelledAt: Date | null;
  createdAt: Date;
};

type ReservationItemContext = {
  itemId: string;
  wishlistId: string;
  ownerUserId: string;
};

export async function getActiveReservationByItemId(itemId: string): Promise<ActiveReservation | null> {
  const normalizedItemId = itemId.trim();

  if (!normalizedItemId) {
    return null;
  }

  const db = await getDb();
  const activeReservation = await db.query.reservations.findFirst({
    columns: {
      id: true,
      wishlistItemId: true,
      userId: true,
      cancelledAt: true,
      createdAt: true,
    },
    where: and(
      eq(reservations.wishlistItemId, normalizedItemId),
      isNull(reservations.cancelledAt),
    ),
    orderBy: [asc(reservations.createdAt), asc(reservations.id)],
  });

  if (!activeReservation || activeReservation.cancelledAt !== null) {
    return null;
  }

  return toActiveReservation(activeReservation);
}

export async function listActiveReservationsByItemIds(
  itemIds: string[],
): Promise<ActiveReservation[]> {
  const normalizedItemIds = Array.from(
    new Set(itemIds.map((itemId) => itemId.trim()).filter(Boolean)),
  );

  if (normalizedItemIds.length === 0) {
    return [];
  }

  const db = await getDb();
  const activeReservations = await db.query.reservations.findMany({
    columns: {
      id: true,
      wishlistItemId: true,
      userId: true,
      cancelledAt: true,
      createdAt: true,
    },
    where: and(
      inArray(reservations.wishlistItemId, normalizedItemIds),
      isNull(reservations.cancelledAt),
    ),
    orderBy: [asc(reservations.createdAt), asc(reservations.id)],
  });

  return activeReservations
    .filter((reservation) => reservation.cancelledAt === null)
    .map(toActiveReservation);
}

export async function getItemReservationAvailability(
  itemId: string,
): Promise<ReservationAvailability> {
  const itemContext = await findReservationItemContext(itemId);

  if (!itemContext) {
    return { status: "unavailable", code: "item-not-found" };
  }

  const activeReservation = await getActiveReservationByItemId(itemContext.itemId);

  if (activeReservation) {
    return { status: "unavailable", code: "already-reserved" };
  }

  return { status: "available" };
}

export async function getItemReservationEligibility(
  userId: string,
  itemId: string,
): Promise<ReservationEligibility> {
  const itemContext = await findReservationItemContext(itemId);

  if (!itemContext) {
    return { status: "ineligible", code: "item-not-found" };
  }

  if (itemContext.ownerUserId === userId) {
    return { status: "ineligible", code: "own-item" };
  }

  const activeReservation = await getActiveReservationByItemId(itemContext.itemId);

  if (activeReservation) {
    return { status: "ineligible", code: "already-reserved" };
  }

  return { status: "eligible" };
}

export async function createReservation(
  userId: string,
  itemId: string,
): Promise<CreateReservationResult> {
  try {
    const itemContext = await findReservationItemContext(itemId);

    if (!itemContext) {
      return { status: "error", code: "item-not-found" };
    }

    if (itemContext.ownerUserId === userId) {
      return { status: "error", code: "own-item" };
    }

    const activeReservation = await getActiveReservationByItemId(itemContext.itemId);

    if (activeReservation) {
      return { status: "error", code: "already-reserved" };
    }

    const db = await getDb();
    const [createdReservation] = await db
      .insert(reservations)
      .values({
        wishlistItemId: itemContext.itemId,
        userId,
      })
      .returning({
        id: reservations.id,
        wishlistItemId: reservations.wishlistItemId,
        userId: reservations.userId,
        cancelledAt: reservations.cancelledAt,
        createdAt: reservations.createdAt,
      });

    if (!createdReservation || createdReservation.cancelledAt !== null) {
      return { status: "error", code: "unknown" };
    }

    return {
      status: "success",
      reservation: toActiveReservation(createdReservation),
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { status: "error", code: "already-reserved" };
    }

    return { status: "error", code: "unknown" };
  }
}

export async function cancelReservation(
  userId: string,
  reservationId: string,
): Promise<CancelReservationResult> {
  try {
    const currentReservation = await findReservationById(reservationId);

    if (!currentReservation || currentReservation.cancelledAt !== null) {
      return { status: "error", code: "reservation-not-found" };
    }

    if (currentReservation.userId !== userId) {
      return { status: "error", code: "not-reservation-owner" };
    }

    const db = await getDb();
    const cancelledReservations = await db
      .update(reservations)
      .set({
        cancelledAt: new Date(),
      })
      .where(
        and(
          eq(reservations.id, currentReservation.id),
          eq(reservations.userId, userId),
          isNull(reservations.cancelledAt),
        ),
      )
      .returning({ id: reservations.id });

    if (cancelledReservations.length === 0) {
      return { status: "error", code: "reservation-not-found" };
    }

    return { status: "success" };
  } catch {
    return { status: "error", code: "unknown" };
  }
}

async function findReservationItemContext(itemId: string): Promise<ReservationItemContext | null> {
  const normalizedItemId = itemId.trim();

  if (!normalizedItemId) {
    return null;
  }

  const db = await getDb();
  const item = await db.query.wishlistItems.findFirst({
    columns: {
      id: true,
      wishlistId: true,
    },
    where: eq(wishlistItems.id, normalizedItemId),
  });

  if (!item) {
    return null;
  }

  const wishlist = await db.query.wishlists.findFirst({
    columns: {
      id: true,
      userId: true,
    },
    where: eq(wishlists.id, item.wishlistId),
  });

  if (!wishlist) {
    return null;
  }

  return {
    itemId: item.id,
    wishlistId: wishlist.id,
    ownerUserId: wishlist.userId,
  };
}

async function findReservationById(reservationId: string): Promise<ReservationRecord | null> {
  const normalizedReservationId = reservationId.trim();

  if (!normalizedReservationId) {
    return null;
  }

  const db = await getDb();

  return (
    (await db.query.reservations.findFirst({
      columns: {
        id: true,
        wishlistItemId: true,
        userId: true,
        cancelledAt: true,
        createdAt: true,
      },
      where: eq(reservations.id, normalizedReservationId),
    })) ?? null
  );
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof DatabaseError && error.code === "23505";
}

function toActiveReservation(reservation: ReservationRecord): ActiveReservation {
  return {
    ...reservation,
    cancelledAt: null,
  };
}

async function getDb() {
  const { db } = await import("@/shared/db");

  return db;
}
