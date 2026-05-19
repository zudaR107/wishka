import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { expect, test } from "@playwright/test";

test("owner can export wishlists and re-import them", async ({ page }) => {
  const runId = randomUUID().slice(0, 8);
  const credentials = { email: `export-test-${runId}@example.com`, password: "password123" };
  const itemTitle = `Export item ${runId}`;

  // ── Register ──────────────────────────────────────────────────────────────
  await page.goto("/register");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Пароль", { exact: true }).fill(credentials.password);
  await page.getByLabel("Повторите пароль").fill(credentials.password);
  await page.locator("#consent").check();
  await page.getByRole("button", { name: "Создать аккаунт" }).click();

  // Log in
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Пароль", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/(?:\?.*)?$/);

  // ── Add an item ───────────────────────────────────────────────────────────
  await page.getByTestId("add-item-toggle").click();
  const createForm = page.getByTestId("wishlist-create-form");
  await createForm.getByLabel("Название").fill(itemTitle);
  await createForm.getByLabel("Цена").fill("999");
  await createForm.getByRole("button", { name: "Добавить", exact: true }).click();
  await expect(page.getByRole("heading", { name: itemTitle, exact: true })).toBeVisible();

  // ── Backup dropdown opens and shows all actions ──────────────────────────
  await test.step("backup dropdown opens and contains export/import actions", async () => {
    await page.getByTestId("backup-dropdown-trigger").click();
    const menu = page.getByTestId("backup-dropdown-menu");
    await expect(menu).toBeVisible();
    await expect(page.getByTestId("export-wishlist-btn")).toBeVisible();
    await expect(page.getByTestId("export-all-btn")).toBeVisible();
    await expect(page.getByTestId("import-wishlist-btn")).toBeVisible();
    // Close dropdown by clicking elsewhere
    await page.keyboard.press("Escape");
    await page.locator("body").click({ position: { x: 10, y: 10 } });
  });

  // ── Export via API and verify Markdown content ────────────────────────────
  await test.step("export API returns valid Markdown with item", async () => {
    const response = await page.request.get("/api/wishlist/export");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/markdown");
    expect(response.headers()["content-disposition"]).toContain("attachment");
    const body = await response.text();
    expect(body).toContain("# Wshka — Мои вишлисты");
    expect(body).toContain(itemTitle);
    expect(body).toContain("999");
  });

  // ── Import dialog opens ───────────────────────────────────────────────────
  await test.step("import dialog opens and closes", async () => {
    await page.getByTestId("backup-dropdown-trigger").click();
    await page.getByTestId("import-wishlist-btn").click();
    await expect(page.getByTestId("import-wishlist-dialog")).toBeVisible();
    await page.getByTestId("import-cancel-btn").click();
    await expect(page.getByTestId("import-wishlist-dialog")).not.toBeVisible();
  });

  // ── Import a valid file ───────────────────────────────────────────────────
  await test.step("import creates a new wishlist from a valid .md file", async () => {
    const importedTitle = `Imported item ${runId}`;
    const md = [
      "# Wshka — Мои вишлисты",
      "",
      `Владелец: ${credentials.email}`,
      "Дата экспорта: 2026-05-19",
      "",
      "---",
      "",
      `## Импортированный список ${runId}`,
      "",
      "| Название | Ссылка | Заметка | Цена | Валюта |",
      "|----------|--------|---------|------|--------|",
      `| ${importedTitle} | — | — | 500 | RUB |`,
      "",
    ].join("\n");

    // Write the file to a temp dir and use Playwright's file chooser
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "wshka-"));
    const filePath = path.join(tmpDir, "test-import.md");
    await fs.writeFile(filePath, md, "utf-8");

    await page.getByTestId("backup-dropdown-trigger").click();
    await page.getByTestId("import-wishlist-btn").click();
    await expect(page.getByTestId("import-wishlist-dialog")).toBeVisible();

    const fileInput = page.getByTestId("import-file-input");
    await fileInput.setInputFiles(filePath);
    await page.getByTestId("import-submit-btn").click();

    const feedback = page.getByTestId("import-feedback");
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText("1");

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
