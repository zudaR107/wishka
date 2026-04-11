import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteSession } = vi.hoisted(() => ({
  deleteSession: vi.fn(),
}));

vi.mock("../../src/modules/auth/server/session", () => ({
  deleteSession,
}));

import { logoutUser } from "../../src/modules/auth/server/logout";

describe("logout user flow", () => {
  beforeEach(() => {
    deleteSession.mockReset();
  });

  it("does nothing when there is no current session token", async () => {
    await expect(logoutUser(undefined)).resolves.toBeUndefined();
    expect(deleteSession).not.toHaveBeenCalled();
  });

  it("removes the current session when a token is present", async () => {
    await expect(logoutUser("session-token")).resolves.toBeUndefined();
    expect(deleteSession).toHaveBeenCalledWith("session-token");
  });
});
