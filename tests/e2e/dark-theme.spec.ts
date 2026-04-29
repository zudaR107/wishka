import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

// ── Guest toggle ──────────────────────────────────────────

test("guest can toggle to dark theme via nav button", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.getByRole("button", { name: "Тёмная тема" }).click();

  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("theme preference persists after page reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Тёмная тема" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();

  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("guest can switch back to light theme", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Тёмная тема" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "Светлая тема" }).click();

  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

// ── System preference default ─────────────────────────────

test("first visit with dark system preference applies dark class", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();

  await page.goto("/");

  await expect(page.locator("html")).toHaveClass(/dark/);
  await context.close();
});

test("first visit with light system preference does not apply dark class", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "light" });
  const page = await context.newPage();

  await page.goto("/");

  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await context.close();
});

// ── Authenticated user toggle ─────────────────────────────

test("authenticated user can toggle theme via gear dropdown", async ({ page }) => {
  await registerUser(page);

  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.getByRole("button", { name: "Меню аккаунта" }).click();
  await page.getByRole("button", { name: "Тёмная тема" }).click();

  await expect(page.locator("html")).toHaveClass(/dark/);
});

// ── Helpers ───────────────────────────────────────────────

async function registerUser(page: Page) {
  const runId = randomUUID().slice(0, 12);
  await page.goto("/register");
  await page.getByLabel("Email").fill(`theme-${runId}@example.com`);
  await page.getByLabel("Пароль", { exact: true }).fill(`Theme!${runId}`);
  await page.getByLabel("Повторите пароль").fill(`Theme!${runId}`);
  await page.locator("#consent").check();
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/(?:\?.*)?$/);
}
