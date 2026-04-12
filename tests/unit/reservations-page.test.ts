import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  listCurrentUserActiveReservations: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("../../src/modules/auth/server/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));

vi.mock("../../src/modules/reservation", () => ({
  cancelReservation: vi.fn(),
  listCurrentUserActiveReservations: mocks.listCurrentUserActiveReservations,
}));

describe("current user reservations page", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.requireCurrentUser.mockReset();
    mocks.listCurrentUserActiveReservations.mockReset();
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
});
