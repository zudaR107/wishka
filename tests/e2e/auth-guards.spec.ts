import { expect, test } from "@playwright/test";

test("login route renders the auth form", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Пароль")).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
});

test("unauthenticated user is redirected from /reservations to /login", async ({ page }) => {
  await page.goto("/reservations");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});
