import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

type Credentials = {
  email: string;
  password: string;
};

test("public wishlist and reserver journey works end to end", async ({ browser }) => {
  const owner = createCredentials("owner");
  const reserver = createCredentials("reserver");
  const runId = randomUUID().slice(0, 8);
  const item = {
    title: `Shared item ${runId}`,
    url: `https://example.com/shared/${runId}`,
    note: `Shared note ${runId}`,
    price: "3490",
  };

  const ownerContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const reserverContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const guestPage = await guestContext.newPage();
  const reserverPage = await reserverContext.newPage();

  try {
    const shareUrl = await test.step("owner prepares a public wishlist with one item", async () => {
      await registerUser(ownerPage, owner);
      await createWishlistItem(ownerPage, item);

      await expect(ownerPage.getByTestId("share-link-url")).toHaveValue(/\/share\//);

      return ownerPage.getByTestId("share-link-url").inputValue();
    });

    await test.step("guest can view the shared wishlist but cannot reserve", async () => {
      await guestPage.goto(await shareUrl);

      await expect(guestPage.getByRole("heading", { name: "Публичный вишлист" })).toBeVisible();
      await expect(guestPage.getByTestId("share-guest-guard")).toContainText(
        "Войдите, чтобы забронировать доступное желание и потом управлять бронями в своём разделе.",
      );

      const guestItemCard = getShareItemCard(guestPage, item.title);

      await expect(guestItemCard).toBeVisible();
      await expect(guestItemCard).toContainText(item.url);
      await expect(guestItemCard).toContainText(item.note);
      await expect(guestItemCard).toContainText("3\u00a0490");
      await expect(guestItemCard.getByRole("button", { name: "Забронировать" })).toHaveCount(0);
      await expect(guestPage.getByText(reserver.email)).toHaveCount(0);
    });

    await test.step("authenticated non-owner can reserve the shared item", async () => {
      await registerUser(reserverPage, reserver);
      await reserverPage.goto(await shareUrl);

      const availableItemCard = getShareItemCard(reserverPage, item.title);

      await expect(availableItemCard.getByRole("button", { name: "Забронировать" })).toBeVisible();
      await availableItemCard.getByRole("button", { name: "Забронировать" }).click();

      await expect(reserverPage).toHaveURL(/\/share\/.*\?status=reservation-created$/);
      await expect(reserverPage.getByText("Желание забронировано.")).toBeVisible();

      const reservedItemCard = getShareItemCard(reserverPage, item.title);

      await expect(reservedItemCard).toContainText("Уже забронировано");
      await expect(reservedItemCard.getByRole("button", { name: "Забронировать" })).toHaveCount(0);
      await expect(reserverPage.locator("main").getByText(reserver.email)).toHaveCount(0);
    });

    await test.step("other viewers see the reserved state without identity leakage", async () => {
      await guestPage.goto(await shareUrl);

      const guestReservedItemCard = getShareItemCard(guestPage, item.title);

      await expect(guestReservedItemCard).toContainText("Уже забронировано");
      await expect(guestReservedItemCard.getByRole("button", { name: "Забронировать" })).toHaveCount(0);
      await expect(guestPage.getByText(reserver.email)).toHaveCount(0);
    });

    await test.step("reserver can cancel the reservation from /reservations", async () => {
      await reserverPage.goto("/reservations");

      await expect(reserverPage.getByRole("heading", { name: "Бронирования" })).toBeVisible();

      const reservationCard = getReservationCard(reserverPage, item.title);

      await expect(reservationCard).toContainText(item.url);
      await expect(reservationCard).toContainText(item.note);
      await expect(reservationCard).toContainText("3\u00a0490");
      await reservationCard.getByRole("button", { name: "Отменить бронь" }).click();

      await expect(reserverPage).toHaveURL(/\/reservations\?status=reservation-cancelled$/);
      await expect(reserverPage.getByText("Бронь отменена.")).toBeVisible();
      await expect(reserverPage.getByTestId("reservations-empty-state")).toBeVisible();
      await expect(reserverPage.getByRole("heading", { name: item.title, exact: true })).toHaveCount(0);
    });

    await test.step("after cancellation the shared item becomes available again", async () => {
      await reserverPage.goto(await shareUrl);

      const availableAgainItemCard = getShareItemCard(reserverPage, item.title);

      await expect(availableAgainItemCard.getByRole("button", { name: "Забронировать" })).toBeVisible();
      await expect(availableAgainItemCard.getByText("Уже забронировано")).toHaveCount(0);
    });
  } finally {
    await Promise.all([
      ownerContext.close(),
      guestContext.close(),
      reserverContext.close(),
    ]);
  }
});

function createCredentials(prefix: string): Credentials {
  const runId = randomUUID().slice(0, 12);

  return {
    email: `${prefix}-${runId}@example.com`,
    password: `Password!${runId}`,
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

async function createWishlistItem(
  page: Page,
  item: { title: string; url: string; note: string; price: string },
) {
  await page.getByTestId("add-item-toggle").click();

  const createForm = page.getByTestId("wishlist-create-form");

  await createForm.getByLabel("Название").fill(item.title);
  await createForm.getByLabel("Ссылка").fill(item.url);
  await createForm.getByLabel("Заметка").fill(item.note);
  await createForm.getByLabel("Цена").fill(item.price);
  await createForm.getByRole("button", { name: "Добавить" }).click();

  await expect(page.getByTestId("wishlist-item-count")).toContainText("1");
}

function getShareItemCard(page: Page, title: string) {
  return page.getByTestId("share-item-card").filter({
    has: page.getByRole("heading", { name: title, exact: true }),
  });
}

function getReservationCard(page: Page, title: string) {
  return page.getByTestId("reservation-card").filter({
    has: page.getByRole("heading", { name: title, exact: true }),
  });
}
