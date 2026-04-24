import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

type Credentials = {
  email: string;
  password: string;
};

test("invalid session cookie is treated as unauthenticated on protected routes", async ({ page }) => {
  await page.context().addCookies([
    {
      name: "wshka_session",
      value: "invalid-session-token",
      url: "http://127.0.0.1:3000",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await page.goto("/reservations");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();

  await page.goto("/login");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("authenticated users are redirected away from auth pages and logout revokes protected access", async ({ page }) => {
  const credentials = createCredentials();

  await registerUser(page, credentials);

  await page.goto("/login");
  await expect(page).toHaveURL(/\/(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name: "Мой вишлист" })).toBeVisible();

  await page.goto("/register");
  await expect(page).toHaveURL(/\/(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name: "Мой вишлист" })).toBeVisible();

  await page.getByRole("button", { name: "Меню аккаунта" }).click();
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/(?:\?.*)?$/);

  await page.goto("/reservations");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

function createCredentials(): Credentials {
  const runId = randomUUID().slice(0, 12);

  return {
    email: `auth-hardening-${runId}@example.com`,
    password: `AuthHardening!${runId}`,
  };
}

async function registerUser(page: Page, credentials: Credentials) {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Регистрация" })).toBeVisible();
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Пароль", { exact: true }).fill(credentials.password);
  await page.getByLabel("Повторите пароль").fill(credentials.password);
  await page.locator("#consent").check();
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/(?:\?.*)?$/);
}
