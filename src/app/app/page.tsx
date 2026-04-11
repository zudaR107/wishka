import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth/server/current-user";
import { getTranslations } from "@/modules/i18n";
import { createCurrentWishlistItem } from "@/modules/wishlist/server/create-item";
import { getCurrentWishlistWithItems } from "@/modules/wishlist/server/items";
import {
  deleteCurrentWishlistItem,
  updateCurrentWishlistItem,
} from "@/modules/wishlist/server/manage-item";
import { PageShell } from "@/shared/ui/page-shell";

const common = getTranslations("common");
const messages = getTranslations("app");

type AppPageProps = {
  searchParams?: Promise<{
    action?: string;
    status?: string;
    error?: string;
  }>;
};

export default async function AppPage(props: AppPageProps) {
  const user = await requireCurrentUser();
  const params = props?.searchParams ? await props.searchParams : undefined;
  const wishlist = await getCurrentWishlistWithItems(user.id);
  const action = params?.action;
  const status = params?.status;
  const errorCode = params?.error;

  return (
    <PageShell
      eyebrow={common.routeSkeleton}
      title={messages.dashboard.title}
      description={messages.dashboard.description}
    >
      <div className="space-y-8">
        {status === "item-created" ? (
          <p className="ui-message ui-message-success">{messages.dashboard.successMessage}</p>
        ) : status === "item-updated" ? (
          <p className="ui-message ui-message-success">{messages.dashboard.updateSuccessMessage}</p>
        ) : status === "item-deleted" ? (
          <p className="ui-message ui-message-success">{messages.dashboard.deleteSuccessMessage}</p>
        ) : null}
        {errorCode ? (
          <p className="ui-message ui-message-error">{getActionErrorMessage(action, errorCode)}</p>
        ) : null}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-3">
            <p className="ui-note">{messages.dashboard.summaryLabel}</p>
            <div
              className="ui-surface p-5"
              style={{ background: "var(--color-bg-subtle)" }}
            >
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="ui-note">ID</dt>
                  <dd className="mt-1 break-all font-medium text-[color:var(--color-text-strong)]">
                    {wishlist.id}
                  </dd>
                </div>
                <div>
                  <dt className="ui-note">{messages.dashboard.itemCountLabel}</dt>
                  <dd className="mt-1 font-medium text-[color:var(--color-text-strong)]">
                    {wishlist.items.length}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="ui-button">
              {messages.dashboard.logoutLabel}
            </button>
          </form>
        </div>

        <section className="ui-surface p-6">
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">
                {messages.dashboard.formTitle}
              </h2>
            </div>
            <form action={createItemAction} className="ui-form max-w-none">
              <div className="ui-field">
                <label className="ui-label" htmlFor="title">
                  {messages.dashboard.fields.title}
                </label>
                <input id="title" name="title" className="ui-input" required />
              </div>
              <div className="ui-field">
                <label className="ui-label" htmlFor="url">
                  {messages.dashboard.fields.url}
                </label>
                <input id="url" name="url" type="url" className="ui-input" />
                <p className="ui-note">{messages.dashboard.hints.url}</p>
              </div>
              <div className="ui-field">
                <label className="ui-label" htmlFor="note">
                  {messages.dashboard.fields.note}
                </label>
                <textarea id="note" name="note" className="ui-input min-h-28 resize-y" />
              </div>
              <div className="ui-field">
                <label className="ui-label" htmlFor="price">
                  {messages.dashboard.fields.price}
                </label>
                <input id="price" name="price" inputMode="decimal" className="ui-input" />
                <p className="ui-note">{messages.dashboard.hints.price}</p>
              </div>
              <button type="submit" className="ui-button">
                {messages.dashboard.submitLabel}
              </button>
            </form>
          </div>
        </section>

        {wishlist.items.length === 0 ? (
          <section className="ui-surface p-6">
            <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">
              {messages.dashboard.emptyTitle}
            </h2>
            <p className="mt-3 text-[color:var(--color-text-base)]">
              {messages.dashboard.emptyDescription}
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">
              {messages.dashboard.itemsTitle}
            </h2>
            <ul className="space-y-4">
              {wishlist.items.map((item) => (
                <li key={item.id} className="ui-surface p-6">
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-[color:var(--color-text-strong)]">
                        {item.title}
                      </h3>
                      {item.url ? (
                        <p className="text-sm text-[color:var(--color-text-base)] break-all">
                          <span className="font-medium text-[color:var(--color-text-strong)]">
                            {messages.dashboard.itemFields.url}: 
                          </span>
                          {item.url}
                        </p>
                      ) : null}
                      {item.note ? (
                        <p className="text-sm text-[color:var(--color-text-base)]">
                          <span className="font-medium text-[color:var(--color-text-strong)]">
                            {messages.dashboard.itemFields.note}: 
                          </span>
                          {item.note}
                        </p>
                      ) : null}
                      {item.price ? (
                        <p className="text-sm text-[color:var(--color-text-base)]">
                          <span className="font-medium text-[color:var(--color-text-strong)]">
                            {messages.dashboard.itemFields.price}: 
                          </span>
                          {item.price}
                        </p>
                      ) : null}
                    </div>
                    <form action={updateItemAction} className="ui-form max-w-none">
                      <input type="hidden" name="itemId" value={item.id} />
                      <div className="ui-field">
                        <label className="ui-label" htmlFor={`title-${item.id}`}>
                          {messages.dashboard.fields.title}
                        </label>
                        <input
                          id={`title-${item.id}`}
                          name="title"
                          defaultValue={item.title}
                          className="ui-input"
                          required
                        />
                      </div>
                      <div className="ui-field">
                        <label className="ui-label" htmlFor={`url-${item.id}`}>
                          {messages.dashboard.fields.url}
                        </label>
                        <input
                          id={`url-${item.id}`}
                          name="url"
                          type="url"
                          defaultValue={item.url ?? ""}
                          className="ui-input"
                        />
                      </div>
                      <div className="ui-field">
                        <label className="ui-label" htmlFor={`note-${item.id}`}>
                          {messages.dashboard.fields.note}
                        </label>
                        <textarea
                          id={`note-${item.id}`}
                          name="note"
                          defaultValue={item.note ?? ""}
                          className="ui-input min-h-28 resize-y"
                        />
                      </div>
                      <div className="ui-field">
                        <label className="ui-label" htmlFor={`price-${item.id}`}>
                          {messages.dashboard.fields.price}
                        </label>
                        <input
                          id={`price-${item.id}`}
                          name="price"
                          inputMode="decimal"
                          defaultValue={item.price ?? ""}
                          className="ui-input"
                        />
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button type="submit" className="ui-button">
                          {messages.dashboard.updateLabel}
                        </button>
                      </div>
                    </form>
                    <form action={deleteItemAction}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button type="submit" className="ui-button">
                        {messages.dashboard.deleteLabel}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageShell>
  );
}

async function logoutAction() {
  "use server";

  const cookieStore = await cookies();
  const [{ AUTH_SESSION_COOKIE_NAME, clearSessionCookie }, { logoutUser }] = await Promise.all([
    import("@/modules/auth/server/session"),
    import("@/modules/auth/server/logout"),
  ]);

  await logoutUser(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);
  await clearSessionCookie();

  redirect("/login?status=logged-out");
}

async function createItemAction(formData: FormData) {
  "use server";

  const user = await requireCurrentUser();
  const result = await createCurrentWishlistItem(user.id, {
    title: getFormValue(formData, "title"),
    url: getFormValue(formData, "url"),
    note: getFormValue(formData, "note"),
    price: getFormValue(formData, "price"),
  });

  if (result.status === "success") {
    redirect("/app?status=item-created");
  }

  redirect(`/app?action=create&error=${result.code}`);
}

async function updateItemAction(formData: FormData) {
  "use server";

  const user = await requireCurrentUser();
  const result = await updateCurrentWishlistItem(user.id, getFormValue(formData, "itemId"), {
    title: getFormValue(formData, "title"),
    url: getFormValue(formData, "url"),
    note: getFormValue(formData, "note"),
    price: getFormValue(formData, "price"),
  });

  if (result.status === "success") {
    redirect("/app?status=item-updated");
  }

  redirect(`/app?action=update&error=${result.code}`);
}

async function deleteItemAction(formData: FormData) {
  "use server";

  const user = await requireCurrentUser();
  const result = await deleteCurrentWishlistItem(user.id, getFormValue(formData, "itemId"));

  if (result.status === "success") {
    redirect("/app?status=item-deleted");
  }

  redirect(`/app?action=delete&error=${result.code}`);
}

function getFormValue(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function getActionErrorMessage(action: string | undefined, errorCode: string): string {
  switch (errorCode) {
    case "invalid-title":
      return messages.dashboard.errors.invalidTitle;
    case "invalid-url":
      return messages.dashboard.errors.invalidUrl;
    case "invalid-price":
      return messages.dashboard.errors.invalidPrice;
    case "item-not-found":
      return messages.dashboard.errors.itemNotFound;
    default:
      if (action === "update") {
        return messages.dashboard.errors.unknownUpdate;
      }

      if (action === "delete") {
        return messages.dashboard.errors.unknownDelete;
      }

      return messages.dashboard.errors.unknownCreate;
  }
}
