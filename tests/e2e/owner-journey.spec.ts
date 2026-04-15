import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

type OwnerCredentials = {
  email: string;
  password: string;
};

test("owner can complete the core wishlist journey end to end", async ({ page }) => {
  const credentials = createOwnerCredentials();
  const itemRunId = randomUUID().slice(0, 8);
  const initialItem = {
    title: `Owner journey item ${itemRunId}`,
    url: `https://example.com/items/${itemRunId}`,
    note: `Initial note ${itemRunId}`,
    price: "1990",
  };
  const updatedItem = {
    title: `Updated owner journey item ${itemRunId}`,
    url: `https://example.com/items/${itemRunId}/updated`,
    note: `Updated note ${itemRunId}`,
    price: "2490",
  };

  await test.step("register and land on the bootstrapped / state", async () => {
    await registerOwner(page, credentials);

    await expect(page).toHaveURL(/\/(?:\?.*)?$/);
    await expect(page.getByRole("heading", { name: "Мой вишлист" })).toBeVisible();
    await expect(page.getByTestId("wishlist-item-count")).toContainText("0");
    await expect(page.getByTestId("wishlist-empty-state")).toBeVisible();
    await expect(page.getByRole("button", { name: "Создать публичную ссылку" })).toBeVisible();

    const sessionCookie = (await page.context().cookies()).find(
      ({ name }) => name === "wshka_session",
    );

    expect(sessionCookie?.value).toBeTruthy();
  });

  await test.step("create and update a wishlist item", async () => {
    // Open the collapsible create form
    await page.getByTestId("add-item-toggle").click();

    const createForm = page.getByTestId("wishlist-create-form");

    await createForm.getByLabel("Название").fill(initialItem.title);
    await createForm.getByLabel("Ссылка").fill(initialItem.url);
    await createForm.getByLabel("Заметка").fill(initialItem.note);
    await createForm.getByLabel("Цена").fill(initialItem.price);
    await createForm.getByRole("button", { name: "Добавить" }).click();

    await expect(page).toHaveURL(/\/\?status=item-created$/);
    await expect(page.getByText("Желание добавлено.")).toBeVisible();
    await expect(page.getByTestId("wishlist-item-count")).toContainText("1");

    const createdItemCard = getWishlistItemCard(page, initialItem.title);

    await expect(createdItemCard).toContainText(initialItem.url);
    await expect(createdItemCard).toContainText(initialItem.note);
    await expect(createdItemCard).toContainText("1990");
    await expect(createdItemCard).toContainText("Статус: доступно");

    // Open the inline edit form
    await createdItemCard.getByTestId("edit-item-toggle").click();

    const updateForm = createdItemCard.locator("form").filter({
      has: page.getByRole("button", { name: "Сохранить" }),
    });

    await updateForm.getByLabel("Название").fill(updatedItem.title);
    await updateForm.getByLabel("Ссылка").fill(updatedItem.url);
    await updateForm.getByLabel("Заметка").fill(updatedItem.note);
    await updateForm.getByLabel("Цена").fill(updatedItem.price);
    await updateForm.getByRole("button", { name: "Сохранить" }).click();

    await expect(page).toHaveURL(/\/\?status=item-updated$/);
    await expect(page.getByText("Желание обновлено.")).toBeVisible();
    await expect(page.getByRole("heading", { name: initialItem.title, exact: true })).toHaveCount(0);

    const updatedItemCard = getWishlistItemCard(page, updatedItem.title);

    await expect(updatedItemCard).toContainText(updatedItem.url);
    await expect(updatedItemCard).toContainText(updatedItem.note);
    await expect(updatedItemCard).toContainText("2490");
  });

  await test.step("create, regenerate, and revoke a share link", async () => {
    await page.getByRole("button", { name: "Создать публичную ссылку" }).click();

    await expect(page).toHaveURL(/\/\?status=share-link-created$/);
    await expect(page.getByText("Публичная ссылка готова.")).toBeVisible();
    await expect(page.getByTestId("share-link-url")).toHaveValue(/\/share\//);

    const firstShareUrl = await page.getByTestId("share-link-url").inputValue();
    const sharePreviewPage = await page.context().newPage();

    await sharePreviewPage.goto(firstShareUrl);
    await expect(sharePreviewPage.getByRole("heading", { name: "Публичный вишлист" })).toBeVisible();
    await expect(
      sharePreviewPage.getByText(
        "Это ваш вишлист. Здесь можно только проверить, как он выглядит по публичной ссылке.",
      ),
    ).toBeVisible();
    await expect(sharePreviewPage.getByRole("heading", { name: updatedItem.title })).toBeVisible();

    await page.getByRole("button", { name: "Создать новую ссылку" }).click();

    await expect(page).toHaveURL(/\/\?status=share-link-regenerated$/);
    await expect(page.getByText("Создана новая публичная ссылка.")).toBeVisible();

    const regeneratedShareUrl = await page.getByTestId("share-link-url").inputValue();

    expect(regeneratedShareUrl).not.toBe(firstShareUrl);

    await sharePreviewPage.goto(firstShareUrl);
    await expect(
      sharePreviewPage.getByRole("heading", { name: "Публичная ссылка недоступна" }),
    ).toBeVisible();

    await sharePreviewPage.goto(regeneratedShareUrl);
    await expect(sharePreviewPage.getByRole("heading", { name: "Публичный вишлист" })).toBeVisible();
    await expect(sharePreviewPage.getByRole("heading", { name: updatedItem.title })).toBeVisible();

    await page.getByRole("button", { name: "Отключить ссылку" }).click();

    await expect(page).toHaveURL(/\/\?status=share-link-revoked$/);
    await expect(page.getByText("Публичная ссылка отключена.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Создать публичную ссылку" })).toBeVisible();

    await sharePreviewPage.goto(regeneratedShareUrl);
    await expect(
      sharePreviewPage.getByRole("heading", { name: "Публичная ссылка недоступна" }),
    ).toBeVisible();

    await sharePreviewPage.close();
  });

  await test.step("delete the item and return to the empty state", async () => {
    const updatedItemCard = getWishlistItemCard(page, updatedItem.title);

    await updatedItemCard.getByRole("button", { name: "Удалить" }).click();

    await expect(page).toHaveURL(/\/\?status=item-deleted$/);
    await expect(page.getByText("Желание удалено.")).toBeVisible();
    await expect(page.getByTestId("wishlist-item-count")).toContainText("0");
    await expect(page.getByTestId("wishlist-empty-state")).toBeVisible();
    await expect(page.getByRole("heading", { name: updatedItem.title, exact: true })).toHaveCount(0);
  });
});

function createOwnerCredentials(): OwnerCredentials {
  const runId = randomUUID().slice(0, 12);

  return {
    email: `owner-journey-${runId}@example.com`,
    password: `OwnerJourney!${runId}`,
  };
}

async function registerOwner(page: Page, credentials: OwnerCredentials) {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Регистрация" })).toBeVisible();
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Пароль").fill(credentials.password);
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
}

function getWishlistItemCard(page: Page, title: string) {
  return page.locator("li").filter({
    has: page.getByRole("heading", { name: title, exact: true }),
  });
}
