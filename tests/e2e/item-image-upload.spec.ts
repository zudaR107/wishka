import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

/** Minimal 1×1 transparent PNG as a hex-encoded buffer. */
const PNG_HEX =
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489" +
  "0000000a49444154789c6260000000020001e221bc330000000049454e44ae426082";

/** Register, log in, and create a wish item. Returns the item card locator. */
async function setupOwnerWithItem(
  page: Parameters<Parameters<typeof test>[1]>[0],
  runId: string,
) {
  const email = `img-test-${runId}@example.com`;
  const password = "test-password-123";
  const itemTitle = `Image test item ${runId}`;

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByLabel("Повторите пароль").fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Создать аккаунт" }).click();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL(/\/(?:\?.*)?$/);

  await page.getByTestId("add-item-toggle").click();
  const createForm = page.getByTestId("wishlist-create-form");
  await createForm.getByLabel("Название").fill(itemTitle);
  await createForm.getByRole("button", { name: "Добавить", exact: true }).click();
  await expect(page.getByRole("heading", { name: itemTitle, exact: true })).toBeVisible();

  return page.locator(".item-card").filter({ hasText: itemTitle });
}

/** Upload a PNG to an item via the picker dialog. Returns the temp file path. */
async function uploadImage(
  page: Parameters<Parameters<typeof test>[1]>[0],
  itemCard: ReturnType<typeof page.locator>,
  runId: string,
) {
  const tmpFile = path.join(os.tmpdir(), `test-${runId}.png`);
  fs.writeFileSync(tmpFile, Buffer.from(PNG_HEX, "hex"));

  await itemCard.getByTestId("edit-item-toggle").click();
  const uploadWidget = itemCard.getByTestId("item-image-upload");
  await expect(uploadWidget).toBeVisible();

  await uploadWidget.getByTestId("item-image-upload-btn").click();

  const pickerDialog = page.locator("dialog.image-picker-dialog");
  await expect(pickerDialog).toBeVisible();

  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    pickerDialog.getByRole("button", { name: /выбрать файл/i }).click(),
  ]);
  await fileChooser.setFiles(tmpFile);

  await expect(itemCard.locator(".item-card-image")).toBeVisible({ timeout: 10_000 });

  return tmpFile;
}

/**
 * E2E: owner can upload and delete an image via the edit widget.
 */
test("owner can upload and delete an item image via the edit widget", async ({ page }) => {
  const runId = randomUUID().slice(0, 8);
  const itemCard = await setupOwnerWithItem(page, runId);
  const tmpFile = await uploadImage(page, itemCard, runId);

  // Delete via the upload widget button.
  const uploadWidget = itemCard.getByTestId("item-image-upload");
  await uploadWidget.getByRole("button", { name: /удалить/i }).click();

  await expect(itemCard.locator(".item-card-image")).not.toBeVisible();
  await expect(uploadWidget.getByTestId("item-image-upload-btn")).toBeVisible();

  fs.unlinkSync(tmpFile);
});

/**
 * E2E: clicking the image opens the lightbox; owner can delete from it.
 */
test("owner can open the image lightbox and delete from it", async ({ page }) => {
  const runId = randomUUID().slice(0, 8);
  const itemCard = await setupOwnerWithItem(page, runId);
  const tmpFile = await uploadImage(page, itemCard, runId);

  // Click the image to open the lightbox.
  await itemCard.locator(".item-card-image").click();

  const lightbox = page.locator("dialog.image-lightbox-dialog");
  await expect(lightbox).toBeVisible();

  // Close button is present.
  await expect(lightbox.getByRole("button", { name: /закрыть/i })).toBeVisible();

  // Delete from the lightbox.
  await lightbox.getByRole("button", { name: /удалить/i }).click();

  // Lightbox closes and image disappears from the card.
  await expect(lightbox).not.toBeVisible();
  await expect(itemCard.locator(".item-card-image")).not.toBeVisible();

  fs.unlinkSync(tmpFile);
});
