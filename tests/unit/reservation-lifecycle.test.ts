import { beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseError } from "pg";

const mocks = vi.hoisted(() => ({
  findReservation: vi.fn(),
  findReservations: vi.fn(),
  findWishlistItem: vi.fn(),
  findWishlist: vi.fn(),
  insert: vi.fn(),
  insertValues: vi.fn(),
  insertReturning: vi.fn(),
  update: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  updateReturning: vi.fn(),
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    query: {
      reservations: {
        findFirst: mocks.findReservation,
        findMany: mocks.findReservations,
      },
      wishlistItems: {
        findFirst: mocks.findWishlistItem,
      },
      wishlists: {
        findFirst: mocks.findWishlist,
      },
    },
    insert: mocks.insert,
    update: mocks.update,
  },
}));

import {
  cancelReservation,
  createReservation,
  getActiveReservationByItemId,
  getItemReservationAvailability,
  getItemReservationEligibility,
  listActiveReservationsByItemIds,
} from "../../src/modules/reservation/server/lifecycle";

describe("reservation lifecycle helpers", () => {
  beforeEach(() => {
    mocks.findReservation.mockReset();
    mocks.findReservations.mockReset();
    mocks.findWishlistItem.mockReset();
    mocks.findWishlist.mockReset();
    mocks.insert.mockReset();
    mocks.insertValues.mockReset();
    mocks.insertReturning.mockReset();
    mocks.update.mockReset();
    mocks.updateSet.mockReset();
    mocks.updateWhere.mockReset();
    mocks.updateReturning.mockReset();

    mocks.insert.mockReturnValue({
      values: mocks.insertValues,
    });
    mocks.insertValues.mockReturnValue({
      returning: mocks.insertReturning,
    });
    mocks.update.mockReturnValue({
      set: mocks.updateSet,
    });
    mocks.updateSet.mockReturnValue({
      where: mocks.updateWhere,
    });
    mocks.updateWhere.mockReturnValue({
      returning: mocks.updateReturning,
    });
    mocks.updateReturning.mockResolvedValue([]);
  });

  it("returns null for a blank active reservation lookup", async () => {
    await expect(getActiveReservationByItemId("   ")).resolves.toBeNull();
    expect(mocks.findReservation).not.toHaveBeenCalled();
  });

  it("loads active reservations for multiple item ids in one batch", async () => {
    const createdAt = new Date("2026-04-12T00:00:00.000Z");

    mocks.findReservations.mockResolvedValue([
      {
        id: "reservation-1",
        wishlistItemId: "item-1",
        userId: "user-2",
        cancelledAt: null,
        createdAt,
      },
    ]);

    await expect(listActiveReservationsByItemIds(["item-1", " item-1 ", "item-2"]))
      .resolves.toEqual([
        {
          id: "reservation-1",
          wishlistItemId: "item-1",
          userId: "user-2",
          cancelledAt: null,
          createdAt,
        },
      ]);
    expect(mocks.findReservations).toHaveBeenCalledTimes(1);
  });

  it("reports item-not-found when reservation availability has no item context", async () => {
    mocks.findWishlistItem.mockResolvedValue(undefined);

    await expect(getItemReservationAvailability("item-1")).resolves.toEqual({
      status: "unavailable",
      code: "item-not-found",
    });
    expect(mocks.findReservation).not.toHaveBeenCalled();
  });

  it("blocks the owner from reserving their own item", async () => {
    mocks.findWishlistItem.mockResolvedValue({
      id: "item-1",
      wishlistId: "wishlist-1",
    });
    mocks.findWishlist.mockResolvedValue({
      id: "wishlist-1",
      userId: "owner-1",
    });

    await expect(getItemReservationEligibility("owner-1", "item-1")).resolves.toEqual({
      status: "ineligible",
      code: "own-item",
    });
    expect(mocks.findReservation).not.toHaveBeenCalled();
  });

  it("creates a reservation for an eligible non-owner item", async () => {
    const createdAt = new Date("2026-04-12T00:00:00.000Z");

    mocks.findWishlistItem.mockResolvedValue({
      id: "item-1",
      wishlistId: "wishlist-1",
    });
    mocks.findWishlist.mockResolvedValue({
      id: "wishlist-1",
      userId: "owner-1",
    });
    mocks.findReservation.mockResolvedValue(undefined);
    mocks.insertReturning.mockResolvedValue([
      {
        id: "reservation-1",
        wishlistItemId: "item-1",
        userId: "user-2",
        cancelledAt: null,
        createdAt,
      },
    ]);

    await expect(createReservation("user-2", "item-1")).resolves.toEqual({
      status: "success",
      reservation: {
        id: "reservation-1",
        wishlistItemId: "item-1",
        userId: "user-2",
        cancelledAt: null,
        createdAt,
      },
    });
    expect(mocks.insertValues).toHaveBeenCalledWith({
      wishlistItemId: "item-1",
      userId: "user-2",
    });
  });

  it("returns already-reserved when the item already has an active reservation", async () => {
    mocks.findWishlistItem.mockResolvedValue({
      id: "item-1",
      wishlistId: "wishlist-1",
    });
    mocks.findWishlist.mockResolvedValue({
      id: "wishlist-1",
      userId: "owner-1",
    });
    mocks.findReservation.mockResolvedValue({
      id: "reservation-1",
      wishlistItemId: "item-1",
      userId: "user-3",
      cancelledAt: null,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
    });

    await expect(createReservation("user-2", "item-1")).resolves.toEqual({
      status: "error",
      code: "already-reserved",
    });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns already-reserved when create races with another active reservation", async () => {
    const duplicateKeyError = new DatabaseError("duplicate key", 0, "error");
    duplicateKeyError.code = "23505";

    mocks.findWishlistItem.mockResolvedValue({
      id: "item-1",
      wishlistId: "wishlist-1",
    });
    mocks.findWishlist.mockResolvedValue({
      id: "wishlist-1",
      userId: "owner-1",
    });
    mocks.findReservation.mockResolvedValue(undefined);
    mocks.insertReturning.mockRejectedValue(duplicateKeyError);

    await expect(createReservation("user-2", "item-1")).resolves.toEqual({
      status: "error",
      code: "already-reserved",
    });
  });

  it("allows only the reservation owner to cancel an active reservation", async () => {
    mocks.findReservation.mockResolvedValue({
      id: "reservation-1",
      wishlistItemId: "item-1",
      userId: "user-2",
      cancelledAt: null,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
    });
    mocks.updateReturning.mockResolvedValue([{ id: "reservation-1" }]);

    await expect(cancelReservation("user-2", "reservation-1")).resolves.toEqual({
      status: "success",
    });
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.updateSet).toHaveBeenCalledWith({
      cancelledAt: expect.any(Date),
    });
  });

  it("rejects cancellation by a different user", async () => {
    mocks.findReservation.mockResolvedValue({
      id: "reservation-1",
      wishlistItemId: "item-1",
      userId: "user-2",
      cancelledAt: null,
      createdAt: new Date("2026-04-12T00:00:00.000Z"),
    });

    await expect(cancelReservation("user-3", "reservation-1")).resolves.toEqual({
      status: "error",
      code: "not-reservation-owner",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
