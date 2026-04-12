import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  listCurrentUserActiveReservations: vi.fn(),
  cancelReservation: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("../../src/modules/auth/server/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));

vi.mock("../../src/modules/reservation", () => ({
  cancelReservation: mocks.cancelReservation,
  listCurrentUserActiveReservations: mocks.listCurrentUserActiveReservations,
}));

function expectRedirectCall(run: () => Promise<unknown>, url: string) {
  mocks.redirect.mockImplementationOnce((target: string) => {
    throw new Error(`REDIRECT:${target}`);
  });

  return expect(run()).rejects.toThrow(`REDIRECT:${url}`);
}

describe("current user reservations page", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.requireCurrentUser.mockReset();
    mocks.listCurrentUserActiveReservations.mockReset();
    mocks.cancelReservation.mockReset();
    mocks.redirect.mockReset();
    mocks.requireCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
  });

  it("renders an empty state when the current user has no active reservations", async () => {
    mocks.listCurrentUserActiveReservations.mockResolvedValue([]);

    const { default: ReservationsPage } = await import("../../src/app/app/reservations/page");
    const page = await ReservationsPage({});
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Активных броней пока нет");
    expect(html).toContain("Когда вы забронируете подарок из публичного вишлиста, он появится здесь.");
  });

  it("renders only the current user's active reservations", async () => {
    mocks.listCurrentUserActiveReservations.mockResolvedValue([
      {
        id: "reservation-1",
        createdAt: new Date("2026-04-12T00:00:00.000Z"),
        item: {
          id: "item-1",
          wishlistId: "wishlist-1",
          title: "Наушники",
          url: "https://example.com/item",
          note: "Нужны беспроводные",
          price: "9990.00",
          createdAt: new Date("2026-04-11T00:00:00.000Z"),
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
        },
      },
    ]);

    const { default: ReservationsPage } = await import("../../src/app/app/reservations/page");
    const page = await ReservationsPage({});
    const html = renderToStaticMarkup(page);

    expect(mocks.listCurrentUserActiveReservations).toHaveBeenCalledWith("user-1");
    expect(html).toContain("Мои брони");
    expect(html).toContain("Наушники");
    expect(html).toContain("https://example.com/item");
    expect(html).toContain("Нужны беспроводные");
    expect(html).toContain("9990.00");
    expect(html).toContain("Отменить бронь");
  });

  it("renders cancel success and error feedback", async () => {
    mocks.listCurrentUserActiveReservations.mockResolvedValue([]);

    const { default: ReservationsPage } = await import("../../src/app/app/reservations/page");
    const successPage = await ReservationsPage({
      searchParams: Promise.resolve({ status: "reservation-cancelled" }),
    });
    const errorPage = await ReservationsPage({
      searchParams: Promise.resolve({ action: "cancel", error: "not-reservation-owner" }),
    });

    expect(renderToStaticMarkup(successPage)).toContain("Бронь отменена.");
    expect(renderToStaticMarkup(errorPage)).toContain(
      "Можно отменить только свою активную бронь.",
    );
  });

  it("redirects after a successful cancel and blocks not-owner or missing reservations", async () => {
    const { cancelReservationAction } = await import("../../src/app/app/reservations/actions");

    const successFormData = new FormData();
    successFormData.set("reservationId", "reservation-1");
    mocks.cancelReservation.mockResolvedValueOnce({ status: "success" });

    await expectRedirectCall(
      () => cancelReservationAction(successFormData),
      "/app/reservations?status=reservation-cancelled",
    );

    const notOwnerFormData = new FormData();
    notOwnerFormData.set("reservationId", "reservation-2");
    mocks.cancelReservation.mockResolvedValueOnce({
      status: "error",
      code: "not-reservation-owner",
    });

    await expectRedirectCall(
      () => cancelReservationAction(notOwnerFormData),
      "/app/reservations?action=cancel&error=not-reservation-owner",
    );

    const missingFormData = new FormData();
    missingFormData.set("reservationId", "reservation-3");
    mocks.cancelReservation.mockResolvedValueOnce({
      status: "error",
      code: "reservation-not-found",
    });

    await expectRedirectCall(
      () => cancelReservationAction(missingFormData),
      "/app/reservations?action=cancel&error=reservation-not-found",
    );
    expect(mocks.cancelReservation).toHaveBeenNthCalledWith(1, "user-1", "reservation-1");
    expect(mocks.cancelReservation).toHaveBeenNthCalledWith(2, "user-1", "reservation-2");
    expect(mocks.cancelReservation).toHaveBeenNthCalledWith(3, "user-1", "reservation-3");
  });
});
