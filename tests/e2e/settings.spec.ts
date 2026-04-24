import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

type Credentials = {
  email: string;
  password: string;
};

test("unauthenticated user is redirected from /settings to /login", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login$/);
});

test("owner opens settings and sees their account email", async ({ page }) => {
  const credentials = createCredentials();

  await registerUser(page, credentials);
  await page.getByRole("button", { name: "Меню аккаунта" }).click();
  await page.getByRole("link", { name: "Настройки" }).click();

  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: "Настройки" })).toBeVisible();
  await expect(page.getByText(credentials.email)).toBeVisible();
});

test("owner saves bio and sees success message", async ({ page }) => {
  const credentials = createCredentials();
  const bio = `Тестовое bio ${randomUUID().slice(0, 8)}`;

  await registerUser(page, credentials);
  await page.goto("/settings");

  await page.locator("textarea[name='bio']").fill(bio);
  await page.getByRole("button", { name: "Сохранить" }).click();

  await expect(page).toHaveURL(/\/settings\?status=saved$/);
  await expect(page.getByTestId("settings-bio-success")).toBeVisible();
});

test("saved bio is visible on share page for authenticated viewer", async ({ browser }) => {
  const owner = createCredentials();
  const viewer = createCredentials();
  const bio = `Bio для теста ${randomUUID().slice(0, 8)}`;

  const ownerContext = await browser.newContext();
  const viewerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const viewerPage = await viewerContext.newPage();

  try {
    await registerUser(ownerPage, owner);
    await ownerPage.goto("/settings");
    await ownerPage.locator("textarea[name='bio']").fill(bio);
    await ownerPage.getByRole("button", { name: "Сохранить" }).click();
    await expect(ownerPage).toHaveURL(/\/settings\?status=saved$/);

    await ownerPage.goto("/");
    await expect(ownerPage.getByTestId("share-link-url")).toHaveValue(/\/share\//);
    const shareUrl = await ownerPage.getByTestId("share-link-url").inputValue();

    await registerUser(viewerPage, viewer);
    await viewerPage.goto(shareUrl);

    await expect(viewerPage.getByTestId("share-owner-card")).toBeVisible();
    await expect(viewerPage.getByText(bio)).toBeVisible();
  } finally {
    await Promise.all([ownerContext.close(), viewerContext.close()]);
  }
});

test("saved bio is not visible on share page for guest viewer", async ({ browser }) => {
  const owner = createCredentials();
  const bio = `Bio для гостя ${randomUUID().slice(0, 8)}`;

  const ownerContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const guestPage = await guestContext.newPage();

  try {
    await registerUser(ownerPage, owner);
    await ownerPage.goto("/settings");
    await ownerPage.locator("textarea[name='bio']").fill(bio);
    await ownerPage.getByRole("button", { name: "Сохранить" }).click();
    await expect(ownerPage).toHaveURL(/\/settings\?status=saved$/);

    await ownerPage.goto("/");
    await expect(ownerPage.getByTestId("share-link-url")).toHaveValue(/\/share\//);
    const shareUrl = await ownerPage.getByTestId("share-link-url").inputValue();

    await guestPage.goto(shareUrl);

    await expect(guestPage.getByTestId("share-owner-card")).toHaveCount(0);
    await expect(guestPage.getByText(bio)).toHaveCount(0);
  } finally {
    await Promise.all([ownerContext.close(), guestContext.close()]);
  }
});

function createCredentials(): Credentials {
  const runId = randomUUID().slice(0, 12);
  return {
    email: `settings-${runId}@example.com`,
    password: `Settings!${runId}`,
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
