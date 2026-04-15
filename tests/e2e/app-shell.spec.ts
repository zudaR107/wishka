import { expect, test } from "@playwright/test";

test("home route renders the app shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Поделись желаниями — получи нужный подарок" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Войти" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Создать аккаунт" }).first()).toBeVisible();
});
