import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectSignal = new Error("redirect");

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn(() => {
    throw redirectSignal;
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("../../src/modules/auth/server/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

describe("auth page behavior", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
    mocks.getCurrentUser.mockReset();
    mocks.redirect.mockClear();
  });

  it("redirects authenticated users away from /login", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });

    const { default: LoginPage } = await import("../../src/app/login/page");

    await expect(LoginPage({})).rejects.toThrow(redirectSignal);
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("redirects authenticated users away from /register", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });

    const { default: RegisterPage } = await import("../../src/app/register/page");

    await expect(RegisterPage({})).rejects.toThrow(redirectSignal);
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("renders the login form for unauthenticated users", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const { default: LoginPage } = await import("../../src/app/login/page");
    const page = await LoginPage({});
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Вход");
    expect(html).toContain("Войти");
  });

  it("renders the register form for unauthenticated users", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const { default: RegisterPage } = await import("../../src/app/register/page");
    const page = await RegisterPage({});
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Регистрация");
    expect(html).toContain("Создать аккаунт");
  });
});
