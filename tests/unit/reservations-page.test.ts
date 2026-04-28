import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  listCurrentUserActiveReservations: vi.fn(),
  cancelReservation: vi.fn(),
}));

vi.mock("../../src/modules/auth/server/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));

vi.mock("../../src/modules/reservation", () => ({
  cancelReservation: mocks.cancelReservation,
  listCurrentUserActiveReservations: mocks.listCurrentUserActiveReservations,
}));

vi.mock("../../src/app/reservations/cancel-reservation-button", () => ({
  CancelReservationButton: ({ cancelLabel }: { cancelLabel: string }) =>
    React.createElement("button", { type: "submit" }, cancelLabel),
}));

describe("current user reservations page", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.requireCurrentUser.mockReset();
    mocks.listCurrentUserActiveReservations.mockReset();
    mocks.cancelReservation.mockReset();
    mocks.requireCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
  });

  it("renders an empty state when the current user has no active reservations", async () => {
    mocks.listCurrentUserActiveReservations.mockResolvedValue([]);

    const { default: ReservationsPage } = await import("../../src/app/reservations/page");
    const page = await ReservationsPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Активных броней пока нет");
    expect(html).toContain(
      "Когда вы забронируете подарок из публичного вишлиста, он появится здесь. Отсюда же бронь можно будет отменить.",
    );
    expect(html).toContain("Вернуться к вишлисту");
  });

  it("renders only the current user's active reservations", async () => {
    mocks.listCurrentUserActiveReservations.mockResolvedValue([
      {
        id: "reservation-1",
        createdAt: new Date("2026-04-12T00:00:00.000Z"),
        isOwnItem: false,
        item: {
          id: "item-1",
          wishlistId: "wishlist-1",
          title: "Наушники",
          url: "https://example.com/item",
          note: "Нужны беспроводные",
          price: "9990",
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
        },
      },
    ]);

    const { default: ReservationsPage } = await import("../../src/app/reservations/page");
    const page = await ReservationsPage();
    const html = renderToStaticMarkup(page);

    expect(mocks.listCurrentUserActiveReservations).toHaveBeenCalledWith("user-1");
    expect(html).toContain("Мои брони");
    expect(html).toContain("Наушники");
    expect(html).toContain("https://example.com/item");
    expect(html).toContain("Нужны беспроводные");
    expect(html).toContain("9 990");
    expect(html).toContain("Отменить бронь");
    expect(html).not.toContain("Моё желание");
  });

  it("shows the own-item badge when the reservation is for the user's own wishlist", async () => {
    mocks.listCurrentUserActiveReservations.mockResolvedValue([
      {
        id: "reservation-2",
        createdAt: new Date("2026-04-12T00:00:00.000Z"),
        isOwnItem: true,
        item: {
          id: "item-2",
          wishlistId: "wishlist-1",
          title: "Книга",
          url: null,
          note: null,
          price: null,
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
        },
      },
    ]);

    const { default: ReservationsPage } = await import("../../src/app/reservations/page");
    const page = await ReservationsPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Книга");
    expect(html).toContain("Моё желание");
  });
});

describe("cancelReservationAction", () => {
  beforeEach(() => {
    mocks.requireCurrentUser.mockReset();
    mocks.cancelReservation.mockReset();
    mocks.requireCurrentUser.mockResolvedValue({ id: "user-1", email: "user@example.com" });
  });

  it("returns success state after successful cancellation", async () => {
    mocks.cancelReservation.mockResolvedValueOnce({ status: "success" });
    const { cancelReservationAction } = await import("../../src/app/reservations/actions");

    const formData = new FormData();
    formData.set("reservationId", "reservation-1");

    await expect(cancelReservationAction(null, formData)).resolves.toEqual({ status: "success" });
    expect(mocks.cancelReservation).toHaveBeenCalledWith("user-1", "reservation-1");
  });

  it("returns error state when the user is not the reservation owner", async () => {
    mocks.cancelReservation.mockResolvedValueOnce({ status: "error", code: "not-reservation-owner" });
    const { cancelReservationAction } = await import("../../src/app/reservations/actions");

    const formData = new FormData();
    formData.set("reservationId", "reservation-2");

    await expect(cancelReservationAction(null, formData)).resolves.toEqual({
      status: "error",
      error: "not-reservation-owner",
    });
  });

  it("returns error state when the reservation is not found", async () => {
    mocks.cancelReservation.mockResolvedValueOnce({ status: "error", code: "reservation-not-found" });
    const { cancelReservationAction } = await import("../../src/app/reservations/actions");

    const formData = new FormData();
    formData.set("reservationId", "reservation-3");

    await expect(cancelReservationAction(null, formData)).resolves.toEqual({
      status: "error",
      error: "reservation-not-found",
    });
  });
});
