import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  sessionFindFirst: vi.fn(),
  userFindFirst: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mocks.cookieGet,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    query: {
      sessions: {
        findFirst: mocks.sessionFindFirst,
      },
      users: {
        findFirst: mocks.userFindFirst,
      },
    },
  },
}));

vi.mock("../../src/modules/auth/server/session", async () => {
  const actual = await vi.importActual<typeof import("../../src/modules/auth/server/session")>(
    "../../src/modules/auth/server/session",
  );

  return {
    ...actual,
  };
});

import {
  getCurrentSession,
  getCurrentSessionToken,
  getCurrentUser,
  requireCurrentUser,
} from "../../src/modules/auth/server/current-user";

describe("current auth helpers", () => {
  beforeEach(() => {
    mocks.cookieGet.mockReset();
    mocks.sessionFindFirst.mockReset();
    mocks.userFindFirst.mockReset();
    mocks.redirect.mockReset();
  });

  it("returns null when session cookie is missing", async () => {
    mocks.cookieGet.mockReturnValue(undefined);

    await expect(getCurrentSessionToken()).resolves.toBeUndefined();
    await expect(getCurrentSession()).resolves.toBeNull();
    expect(mocks.sessionFindFirst).not.toHaveBeenCalled();
  });

  it("treats invalid session tokens as unauthenticated without side effects", async () => {
    mocks.cookieGet.mockReturnValue({ value: "stale-token" });
    mocks.sessionFindFirst.mockResolvedValue(null);

    await expect(getCurrentSession()).resolves.toBeNull();
  });

  it("loads the current user from a valid session", async () => {
    mocks.cookieGet.mockReturnValue({ value: "valid-token" });
    mocks.sessionFindFirst.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      sessionToken: "valid-token",
      expiresAt: new Date("2026-05-01T00:00:00.000Z"),
    });
    mocks.userFindFirst.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });

    await expect(getCurrentUser()).resolves.toEqual({
      id: "user-1",
      email: "user@example.com",
    });
  });

  it("redirects to login when the current user is missing", async () => {
    mocks.cookieGet.mockReturnValue(undefined);

    await requireCurrentUser();

    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
});
