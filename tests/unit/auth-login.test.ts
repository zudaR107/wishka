import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, verifyPassword, createSession, redirect, setSessionCookie } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  verifyPassword: vi.fn(),
  createSession: vi.fn(),
  redirect: vi.fn(),
  setSessionCookie: vi.fn(),
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
  setSessionCookie,
}));

vi.mock("next/navigation", () => ({
  redirect,
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

  it("returns a generic error when the user does not exist", async () => {
    findFirst.mockResolvedValue(undefined);

    await expect(
      loginUser({ email: "missing@example.com", password: "wrong-password" }),
    ).resolves.toEqual({
      status: "error",
      code: "invalid-credentials",
    });
    expect(verifyPassword).not.toHaveBeenCalled();
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

describe("isSafeNextUrl", () => {
  it("accepts relative paths", async () => {
    const { isSafeNextUrl } = await import("../../src/app/login/login-utils");

    expect(isSafeNextUrl("/share/abc123")).toBe(true);
    expect(isSafeNextUrl("/reservations")).toBe(true);
    expect(isSafeNextUrl("/")).toBe(true);
  });

  it("rejects empty strings, external URLs, and protocol-relative URLs", async () => {
    const { isSafeNextUrl } = await import("../../src/app/login/login-utils");

    expect(isSafeNextUrl("")).toBe(false);
    expect(isSafeNextUrl("https://evil.com")).toBe(false);
    expect(isSafeNextUrl("//evil.com")).toBe(false);
    expect(isSafeNextUrl("evil.com/path")).toBe(false);
  });
});

describe("loginAction next redirect", () => {
  function makeLoginFormData(
    email: string,
    password: string,
    next = "",
  ): FormData {
    const fd = new FormData();
    fd.set("email", email);
    fd.set("password", password);
    fd.set("next", next);
    return fd;
  }

  function setupSuccessfulLogin() {
    const expiresAt = new Date("2026-05-01T00:00:00.000Z");
    findFirst.mockResolvedValue({ id: "user-1", passwordHash: "hash" });
    verifyPassword.mockResolvedValue(true);
    createSession.mockResolvedValue({ sessionToken: "tok", expiresAt });
    setSessionCookie.mockResolvedValue(undefined);
    redirect.mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  }

  beforeEach(() => {
    findFirst.mockReset();
    verifyPassword.mockReset();
    createSession.mockReset();
    setSessionCookie.mockReset();
    redirect.mockReset();
  });

  it("redirects to / when next is absent", async () => {
    setupSuccessfulLogin();
    const { loginAction } = await import("../../src/app/login/actions");

    await expect(
      loginAction(null, makeLoginFormData("user@example.com", "password")),
    ).rejects.toThrow("REDIRECT:/");
  });

  it("redirects to next when it is a valid relative path", async () => {
    setupSuccessfulLogin();
    const { loginAction } = await import("../../src/app/login/actions");

    await expect(
      loginAction(null, makeLoginFormData("user@example.com", "password", "/share/abc123")),
    ).rejects.toThrow("REDIRECT:/share/abc123");
  });

  it("redirects to / when next is an external URL", async () => {
    setupSuccessfulLogin();
    const { loginAction } = await import("../../src/app/login/actions");

    await expect(
      loginAction(null, makeLoginFormData("user@example.com", "password", "https://evil.com")),
    ).rejects.toThrow("REDIRECT:/");
  });

  it("redirects to / when next is a protocol-relative URL", async () => {
    setupSuccessfulLogin();
    const { loginAction } = await import("../../src/app/login/actions");

    await expect(
      loginAction(null, makeLoginFormData("user@example.com", "password", "//evil.com")),
    ).rejects.toThrow("REDIRECT:/");
  });
});
