import { and, eq } from "drizzle-orm";
import { listActiveReservationsByItemIds } from "@/modules/reservation";
import { shareLinks } from "@/modules/share/db/schema";
import { type CurrentShareLink } from "@/modules/share/server/current-share-link";
import {
  getWishlistWithItems,
  type WishlistItemRecord,
} from "@/modules/wishlist/server/items";
import { users } from "@/modules/auth/db/schema";

export type PublicWishlistItemReservation = {
  status: "available" | "reserved";
};

export type PublicWishlistItem = WishlistItemRecord & {
  reservation: PublicWishlistItemReservation;
};

export type PublicWishlistOwner = {
  email: string;
  bio: string | null;
};

export type PublicWishlist = {
  id: string;
  items: PublicWishlistItem[];
  shareLink: {
    id: string;
    token: string;
  };
};

export type PublicWishlistViewer = {
  isAuthenticated: boolean;
  isOwner: boolean;
};

export type PublicWishlistView = PublicWishlist & {
  viewer: PublicWishlistViewer;
  owner: PublicWishlistOwner;
};

export async function getActiveShareLinkByToken(token: string): Promise<CurrentShareLink | null> {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    return null;
  }

  const db = await getDb();

  return (
    (await db.query.shareLinks.findFirst({
      columns: {
        id: true,
        wishlistId: true,
        token: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      where: and(eq(shareLinks.token, normalizedToken), eq(shareLinks.isActive, true)),
    })) ?? null
  );
}

export async function getPublicWishlistByShareToken(token: string): Promise<PublicWishlist | null> {
  return getReservationAwarePublicWishlistByShareToken(token);
}

export async function getPublicWishlistViewByShareToken(
  token: string,
  viewerUserId?: string,
): Promise<PublicWishlistView | null> {
  const data = await loadPublicWishlistByShareToken(token);

  if (!data) {
    return null;
  }

  const ownerProfile = await getOwnerProfile(data.wishlist.userId);

  return {
    ...buildPublicWishlist(data),
    viewer: {
      isAuthenticated: Boolean(viewerUserId),
      isOwner: viewerUserId === data.wishlist.userId,
    },
    owner: {
      email: ownerProfile?.email ?? "",
      bio: ownerProfile?.bio ?? null,
    },
  };
}

export async function getReservationAwarePublicWishlistByShareToken(
  token: string,
): Promise<PublicWishlist | null> {
  const data = await loadPublicWishlistByShareToken(token);

  if (!data) {
    return null;
  }

  return buildPublicWishlist(data);
}

async function loadPublicWishlistByShareToken(token: string) {
  const shareLink = await getActiveShareLinkByToken(token);

  if (!shareLink) {
    return null;
  }

  const wishlist = await getWishlistWithItems(shareLink.wishlistId);

  if (!wishlist) {
    return null;
  }

  const activeReservationItemIds = new Set(
    (await listActiveReservationsByItemIds(wishlist.items.map((item) => item.id))).map(
      (reservation) => reservation.wishlistItemId,
    ),
  );

  return {
    shareLink,
    wishlist,
    activeReservationItemIds,
  };
}

function buildPublicWishlist(data: {
  shareLink: CurrentShareLink;
  wishlist: Awaited<ReturnType<typeof getWishlistWithItems>> extends infer T
    ? NonNullable<T>
    : never;
  activeReservationItemIds: Set<string>;
}): PublicWishlist {
  const items = data.wishlist.items.map((item) => ({
    ...item,
    reservation: getPublicWishlistItemReservation(item.id, data.activeReservationItemIds),
  }));

  return {
    id: data.wishlist.id,
    items,
    shareLink: {
      id: data.shareLink.id,
      token: data.shareLink.token,
    },
  };
}

function getPublicWishlistItemReservation(
  itemId: string,
  activeReservationItemIds: Set<string>,
): PublicWishlistItemReservation {
  if (activeReservationItemIds.has(itemId)) {
    return { status: "reserved" };
  }

  return { status: "available" };
}

async function getOwnerProfile(userId: string): Promise<{ email: string; bio: string | null } | null> {
  const db = await getDb();

  const user = await db.query.users.findFirst({
    columns: { email: true, bio: true },
    where: eq(users.id, userId),
  });

  return user ?? null;
}

async function getDb() {
  const { db } = await import("@/shared/db");

  return db;
}
