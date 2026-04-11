import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, verifyPassword, createSession } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  verifyPassword: vi.fn(),
  createSession: vi.fn(),
}));

vi.mock("../../src/shared/db", () => ({
  db: {
    query: {
      users: {
        findFirst,
      },
    },
  },
}));

vi.mock("../../src/modules/auth/server/password", () => ({
  verifyPassword,
}));

vi.mock("../../src/modules/auth/server/session", () => ({
  createSession,
}));

import { loginUser } from "../../src/modules/auth/server/login";
import { validateLoginUserInput } from "../../src/modules/auth/server/login-input";

describe("login user validation", () => {
  it("rejects malformed credentials before querying the database", async () => {
    expect(validateLoginUserInput({ email: "bad-email", password: "" })).toEqual({
      status: "error",
      code: "invalid-input",
    });

    await expect(loginUser({ email: "bad-email", password: "" })).resolves.toEqual({
      status: "error",
      code: "invalid-input",
    });
    expect(findFirst).not.toHaveBeenCalled();
  });
});

describe("login user flow", () => {
  beforeEach(() => {
    findFirst.mockReset();
    verifyPassword.mockReset();
    createSession.mockReset();
  });

  it("returns a generic error when user credentials are invalid", async () => {
    findFirst.mockResolvedValue({
      id: "user-1",
      passwordHash: "stored-hash",
    });
    verifyPassword.mockResolvedValue(false);

    await expect(
      loginUser({ email: "USER@example.com", password: "wrong-password" }),
    ).resolves.toEqual({
      status: "error",
      code: "invalid-credentials",
    });
    expect(createSession).not.toHaveBeenCalled();
  });

  it("creates a session after successful credential verification", async () => {
    const expiresAt = new Date("2026-05-01T00:00:00.000Z");

    findFirst.mockResolvedValue({
      id: "user-1",
      passwordHash: "stored-hash",
    });
    verifyPassword.mockResolvedValue(true);
    createSession.mockResolvedValue({
      sessionToken: "session-token",
      expiresAt,
    });

    await expect(
      loginUser({ email: " USER@example.com ", password: "correct-password" }),
    ).resolves.toEqual({
      status: "success",
      sessionToken: "session-token",
      expiresAt,
    });
    expect(verifyPassword).toHaveBeenCalledWith("correct-password", "stored-hash");
    expect(createSession).toHaveBeenCalledWith("user-1");
  });
});
