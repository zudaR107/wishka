import { expect, test } from "@playwright/test";

test("home route renders the app shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Минималистичный каркас Wshka" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Каркас входа" })).toBeVisible();
});
