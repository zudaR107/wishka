import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

/**
 * E2E test: item image upload.
 *
 * Registers a new owner, creates an item, opens the edit section,
 * uploads a small PNG image, verifies it appears in the item card,
 * then deletes it and verifies it is gone.
 */
test("owner can upload and delete an item image", async ({ page }) => {
  const runId = randomUUID().slice(0, 8);
  const email = `img-test-${runId}@example.com`;
  const password = "test-password-123";
  const itemTitle = `Image test item ${runId}`;

  // ── Register ────────────────────────────────────────────────────────────
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

  // ── Create item ─────────────────────────────────────────────────────────
  await page.getByTestId("add-item-toggle").click();
  const createForm = page.getByTestId("wishlist-create-form");
  await createForm.getByLabel("Название").fill(itemTitle);
  await createForm.getByRole("button", { name: "Добавить", exact: true }).click();

  await expect(page.getByRole("heading", { name: itemTitle, exact: true })).toBeVisible();

  // ── Open edit section ───────────────────────────────────────────────────
  const itemCard = page.locator(".item-card").filter({ hasText: itemTitle });
  await itemCard.getByTestId("edit-item-toggle").click();

  const uploadWidget = itemCard.getByTestId("item-image-upload");
  await expect(uploadWidget).toBeVisible();

  // ── Upload a tiny PNG ───────────────────────────────────────────────────
  // Create a minimal 1×1 transparent PNG in a temp file.
  const pngBytes = Buffer.from(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489" +
    "0000000a49444154789c6260000000020001e221bc330000000049454e44ae426082",
    "hex",
  );
  const tmpFile = path.join(os.tmpdir(), `test-${runId}.png`);
  fs.writeFileSync(tmpFile, pngBytes);

  // Use Playwright's file chooser interception to supply the temp file.
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    uploadWidget.getByTestId("item-image-upload-btn").click(),
  ]);
  await fileChooser.setFiles(tmpFile);

  // Wait for the preview image to appear (upload succeeded).
  await expect(itemCard.locator(".item-image-preview")).toBeVisible({ timeout: 10_000 });

  // The item card image (read view) should also become visible after
  // the component updates its local state.
  // (no router.refresh needed — ItemImageUpload updates imageUrl via useState)
  await expect(itemCard.locator(".item-image-preview")).toBeVisible();

  // ── Delete the image ─────────────────────────────────────────────────────
  await itemCard.getByRole("button", { name: /удалить фото/i }).click();

  // Preview should disappear and the upload button should re-appear.
  await expect(itemCard.locator(".item-image-preview")).not.toBeVisible();
  await expect(uploadWidget.getByTestId("item-image-upload-btn")).toBeVisible();

  // Cleanup temp file.
  fs.unlinkSync(tmpFile);
});
