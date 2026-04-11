import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
}));

vi.mock("../../src/modules/auth/server/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));

describe("protected owner routes", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.requireCurrentUser.mockReset();
    mocks.requireCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
  });

  it("guards /app on the server", async () => {
    const { default: AppPage } = await import("../../src/app/app/page");

    await AppPage();

    expect(mocks.requireCurrentUser).toHaveBeenCalled();
  });

  it("guards /app/reservations on the server", async () => {
    const { default: ReservationsPage } = await import("../../src/app/app/reservations/page");

    await ReservationsPage();

    expect(mocks.requireCurrentUser).toHaveBeenCalled();
  });
});
