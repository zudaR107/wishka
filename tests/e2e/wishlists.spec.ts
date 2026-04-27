import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

type Credentials = {
  email: string;
  password: string;
};

function createCredentials(): Credentials {
  const runId = randomUUID().slice(0, 12);
  return {
    email: `wishlists-e2e-${runId}@example.com`,
    password: `Wishlists!${runId}`,
  };
}

async function registerAndLand(page: Page, credentials: Credentials) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Пароль", { exact: true }).fill(credentials.password);
  await page.getByLabel("Повторите пароль").fill(credentials.password);
  await page.locator("#consent").check();
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name: "Мой список" })).toBeVisible();
}

test("default wishlist is created on registration and can be renamed", async ({ page }) => {
  const credentials = createCredentials();

  await registerAndLand(page, credentials);

  // Default wishlist shows in dropdown trigger
  await expect(page.getByTestId("wishlist-select")).toContainText("Мой список");

  // Rename the default wishlist
  await page.getByTestId("rename-wishlist-btn").click();
  const renameInput = page.getByPlaceholder("Новое название");
  await expect(renameInput).toBeFocused();
  await renameInput.fill("Новое имя");
  await page.getByRole("button", { name: "Сохранить" }).click();

  await expect(page.getByRole("heading", { name: "Новое имя" })).toBeVisible();
  await expect(page.getByTestId("wishlist-select")).toContainText("Новое имя");
});

test("owner can create a second wishlist and switch between them", async ({ page }) => {
  const credentials = createCredentials();
  const runId = randomUUID().slice(0, 6);
  const secondName = `День рождения ${runId}`;

  await registerAndLand(page, credentials);

  // Create second wishlist
  await page.getByTestId("create-wishlist-btn").click();
  const createInput = page.getByPlaceholder("Название вишлиста");
  await createInput.fill(secondName);
  await page.getByRole("button", { name: "Создать" }).click();

  // Should now show the new wishlist as selected
  await expect(page.getByRole("heading", { name: secondName })).toBeVisible();

  // Switch back to first via dropdown
  await page.getByTestId("wishlist-select").click();
  await page.getByRole("option", { name: "Мой список" }).getByRole("button").click();

  await expect(page.getByRole("heading", { name: "Мой список" })).toBeVisible();

  // Switch to second again
  await page.getByTestId("wishlist-select").click();
  await page.getByRole("option", { name: secondName }).getByRole("button").click();

  await expect(page.getByRole("heading", { name: secondName })).toBeVisible();
});

test("cannot delete the last remaining wishlist", async ({ page }) => {
  const credentials = createCredentials();

  await registerAndLand(page, credentials);

  // Delete button should be disabled when only one wishlist exists
  const deleteBtn = page.getByRole("button", { name: "Удалить" }).first();
  await expect(deleteBtn).toBeDisabled();
});

test("owner can delete a non-last wishlist", async ({ page }) => {
  const credentials = createCredentials();
  const runId = randomUUID().slice(0, 6);
  const secondName = `Список для удаления ${runId}`;

  await registerAndLand(page, credentials);

  // Create second wishlist so delete becomes available
  await page.getByTestId("create-wishlist-btn").click();
  await page.getByPlaceholder("Название вишлиста").fill(secondName);
  await page.getByRole("button", { name: "Создать" }).click();

  await expect(page.getByRole("heading", { name: secondName })).toBeVisible();

  // Delete the second wishlist
  await page.getByRole("button", { name: "Удалить" }).first().click();
  await page.getByRole("button", { name: "Да, удалить" }).click();

  // Falls back to first wishlist after deletion
  await expect(page.getByRole("heading", { name: "Мой список" })).toBeVisible();

  // Deleted wishlist no longer in dropdown
  await page.getByTestId("wishlist-select").click();
  await expect(page.getByRole("option", { name: secondName })).toHaveCount(0);
});

test("each wishlist has its own independent share link", async ({ page }) => {
  const credentials = createCredentials();
  const runId = randomUUID().slice(0, 6);
  const secondName = `Вишлист 2 ${runId}`;

  await registerAndLand(page, credentials);

  const firstShareUrl = await page.getByTestId("share-link-url").inputValue();
  expect(firstShareUrl).toMatch(/\/share\//);

  // Create second wishlist
  await page.getByTestId("create-wishlist-btn").click();
  await page.getByPlaceholder("Название вишлиста").fill(secondName);
  await page.getByRole("button", { name: "Создать" }).click();

  await expect(page.getByRole("heading", { name: secondName })).toBeVisible();

  const secondShareUrl = await page.getByTestId("share-link-url").inputValue();
  expect(secondShareUrl).toMatch(/\/share\//);

  // Share links must be different
  expect(firstShareUrl).not.toBe(secondShareUrl);

  // Switch back to first — first share URL should still match
  await page.getByTestId("wishlist-select").click();
  await page.getByRole("option", { name: "Мой список" }).getByRole("button").click();

  await expect(page.getByTestId("share-link-url")).toHaveValue(firstShareUrl);
});
