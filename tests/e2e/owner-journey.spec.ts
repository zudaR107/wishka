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
    await expect(page.getByTestId("share-link-url")).toBeVisible();

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

    await expect(page.getByText("Желание добавлено.")).toBeVisible();
    await expect(page.getByTestId("wishlist-item-count")).toContainText("1");

    const createdItemCard = getWishlistItemCard(page, initialItem.title);

    await expect(createdItemCard).toBeVisible();
    await expect(createdItemCard).toContainText(initialItem.url);
    await expect(createdItemCard).toContainText(initialItem.note);
    await expect(createdItemCard).toContainText("1\u00a0990");
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

    await expect(page.getByText("Желание обновлено.")).toBeVisible();
    await expect(page.getByRole("heading", { name: initialItem.title, exact: true })).toHaveCount(0);

    const updatedItemCard = getWishlistItemCard(page, updatedItem.title);

    await expect(updatedItemCard).toBeVisible();
    await expect(updatedItemCard).toContainText(updatedItem.url);
    await expect(updatedItemCard).toContainText(updatedItem.note);
    await expect(updatedItemCard).toContainText("2\u00a0490");
  });

  await test.step("owner can star and unstar a wishlist item", async () => {
    const itemCard = getWishlistItemCard(page, updatedItem.title);
    const starBtn = itemCard.getByRole("button", { name: "Добавить в избранное" });

    await expect(starBtn).toBeVisible();
    await expect(starBtn).toHaveAttribute("aria-pressed", "false");

    await starBtn.click();

    await expect(itemCard.getByRole("button", { name: "Убрать из избранного" })).toBeVisible();
    await expect(itemCard.getByRole("button", { name: "Убрать из избранного" })).toHaveAttribute("aria-pressed", "true");

    // Share page shows a read-only star for starred items
    const shareUrl = await page.getByTestId("share-link-url").inputValue();
    const sharePreviewPage = await page.context().newPage();

    await sharePreviewPage.goto(shareUrl);

    const shareItemCard = sharePreviewPage.getByTestId("share-item-card").filter({
      has: sharePreviewPage.getByRole("heading", { name: updatedItem.title, exact: true }),
    });

    await expect(shareItemCard.locator(".share-item-star")).toBeVisible();
    await sharePreviewPage.close();

    // Unstar to restore neutral state
    await itemCard.getByRole("button", { name: "Убрать из избранного" }).click();
    await expect(itemCard.getByRole("button", { name: "Добавить в избранное" })).toBeVisible();
  });

  await test.step("regenerate the share link and verify the old one is invalid", async () => {
    await expect(page.getByTestId("share-link-url")).toHaveValue(/\/share\//);

    const firstShareUrl = await page.getByTestId("share-link-url").inputValue();
    const sharePreviewPage = await page.context().newPage();

    await sharePreviewPage.goto(firstShareUrl);
    await expect(sharePreviewPage.getByRole("heading", { name: "Публичный вишлист" })).toBeVisible();
    await expect(
      sharePreviewPage.getByText(
        "Это ваш вишлист. Здесь можно проверить, как он выглядит, и забронировать желания, которые уже исполнены.",
      ),
    ).toBeVisible();
    await expect(sharePreviewPage.getByRole("heading", { name: updatedItem.title })).toBeVisible();

    await page.getByRole("button", { name: "Сменить ссылку" }).click();
    await page.getByRole("button", { name: "Да, сменить" }).click();

    await expect(page.getByTestId("share-link-url")).not.toHaveValue(firstShareUrl);
    const regeneratedShareUrl = await page.getByTestId("share-link-url").inputValue();

    expect(regeneratedShareUrl).not.toBe(firstShareUrl);

    await sharePreviewPage.goto(firstShareUrl);
    await expect(
      sharePreviewPage.getByRole("heading", { name: "Публичная ссылка недоступна" }),
    ).toBeVisible();

    await sharePreviewPage.goto(regeneratedShareUrl);
    await expect(sharePreviewPage.getByRole("heading", { name: "Публичный вишлист" })).toBeVisible();
    await expect(sharePreviewPage.getByRole("heading", { name: updatedItem.title })).toBeVisible();

    await sharePreviewPage.close();
  });

  await test.step("owner can reserve their own item via the share page", async () => {
    const shareUrl = await page.getByTestId("share-link-url").inputValue();
    const sharePreviewPage = await page.context().newPage();

    await sharePreviewPage.goto(shareUrl);

    const itemCard = sharePreviewPage.getByTestId("share-item-card").filter({
      has: sharePreviewPage.getByRole("heading", { name: updatedItem.title, exact: true }),
    });

    await expect(itemCard.getByRole("button", { name: "Забронировать" })).toBeVisible();
    await itemCard.getByRole("button", { name: "Забронировать" }).click();

    await expect(sharePreviewPage).toHaveURL(/\/share\/.*\?status=reservation-created$/);
    await expect(sharePreviewPage.getByText("Желание забронировано.")).toBeVisible();

    const reservedCard = sharePreviewPage.getByTestId("share-item-card").filter({
      has: sharePreviewPage.getByRole("heading", { name: updatedItem.title, exact: true }),
    });

    await expect(reservedCard).toContainText("Уже забронировано");
    await expect(reservedCard.getByRole("button", { name: "Забронировать" })).toHaveCount(0);

    await sharePreviewPage.close();
  });

  await test.step("delete the item and return to the empty state", async () => {
    const updatedItemCard = getWishlistItemCard(page, updatedItem.title);

    await updatedItemCard.getByRole("button", { name: "Удалить" }).click();
    await page.getByRole("button", { name: "Да, удалить" }).click();

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
  await page.getByLabel("Пароль", { exact: true }).fill(credentials.password);
  await page.getByLabel("Повторите пароль").fill(credentials.password);
  await page.locator("#consent").check();
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
}

function getWishlistItemCard(page: Page, title: string) {
  return page.locator("li").filter({
    has: page.getByRole("heading", { name: title, exact: true }),
  });
}
