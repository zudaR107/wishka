import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

test("owner can open the QR code modal and close it", async ({ page }) => {
  await registerOwner(page, createCredentials());

  await expect(page.getByTestId("share-link-url")).toBeVisible();

  await test.step("QR button is visible in the share URL row", async () => {
    await expect(page.getByRole("button", { name: "QR" })).toBeVisible();
  });

  await test.step("clicking QR button opens the modal with the QR code", async () => {
    await page.getByRole("button", { name: "QR" }).click();

    const dialog = page.getByTestId("qr-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Скачать PNG" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Закрыть" })).toBeVisible();
    await expect(dialog.locator("canvas")).toBeVisible();
  });

  await test.step("close button dismisses the modal", async () => {
    await page.getByTestId("qr-dialog").getByRole("button", { name: "Закрыть" }).click();
    await expect(page.getByTestId("qr-dialog")).not.toBeVisible();
  });
});

function createCredentials() {
  const id = randomUUID().slice(0, 8);
  return { email: `qr-test-${id}@example.com`, password: "password123" };
}

async function registerOwner(page: Page, credentials: { email: string; password: string }) {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Регистрация" })).toBeVisible();
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Пароль", { exact: true }).fill(credentials.password);
  await page.getByLabel("Повторите пароль").fill(credentials.password);
  await page.locator("#consent").check();
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/(?:\?.*)?$/);
}
