import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "@/modules/i18n";
import { PageShell } from "@/shared/ui/page-shell";

const common = getTranslations("common");
const messages = getTranslations("app");

type SharePageProps = {
  params?: Promise<{
    token?: string;
  }>;
  searchParams?: Promise<{
    action?: string;
    status?: string;
    error?: string;
  }>;
};

export default async function SharePage(props: SharePageProps) {
  const params = props?.params ? await props.params : undefined;
  const search = props?.searchParams ? await props.searchParams : undefined;
  const token = params?.token ?? "";
  const [{ getCurrentUser }, { getPublicWishlistViewByShareToken }] = await Promise.all([
    import("@/modules/auth/server/current-user"),
    import("@/modules/share/server/public-wishlist"),
  ]);
  const currentUser = await getCurrentUser();
  const publicWishlist = await getPublicWishlistViewByShareToken(token, currentUser?.id);
  const action = search?.action;
  const status = search?.status;
  const errorCode = search?.error;

  if (!publicWishlist) {
    return (
      <PageShell
        eyebrow={common.brand}
        title={messages.share.unavailableTitle}
        description={messages.share.unavailableDescription}
      />
    );
  }

  return (
    <PageShell
      eyebrow={common.brand}
      title={messages.share.title}
      description={messages.share.description}
    >
      {status === "reservation-created" ? (
        <p className="ui-message ui-message-success">{messages.share.successMessage}</p>
      ) : null}
      {errorCode ? (
        <p className="ui-message ui-message-error">{getShareActionErrorMessage(action, errorCode)}</p>
      ) : null}
      {!publicWishlist.viewer.isAuthenticated ? (
        <div className="ui-surface p-4">
          <p className="text-sm text-[color:var(--color-text-base)]">{messages.share.guestHint}</p>
          <div className="mt-3">
            <Link href="/login" className="ui-button inline-flex">
              {messages.share.loginToReserveLabel}
            </Link>
          </div>
        </div>
      ) : publicWishlist.viewer.isOwner ? (
        <p className="ui-message ui-message-error">{messages.share.ownerHint}</p>
      ) : null}
      {publicWishlist.items.length === 0 ? (
        <section className="ui-surface p-6">
          <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">
            {messages.share.emptyTitle}
          </h2>
          <p className="mt-3 text-[color:var(--color-text-base)]">
            {messages.share.emptyDescription}
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">
            {messages.share.itemsTitle}
          </h2>
          <ul className="space-y-4">
            {publicWishlist.items.map((item) => (
              <li key={item.id} className="ui-surface p-6">
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-[color:var(--color-text-strong)]">
                    {item.title}
                  </h3>
                  {item.url ? (
                    <p className="text-sm text-[color:var(--color-text-base)] break-all">
                      <span className="font-medium text-[color:var(--color-text-strong)]">
                        {messages.share.itemFields.url}: 
                      </span>
                      <Link href={item.url} className="underline underline-offset-2">
                        {item.url}
                      </Link>
                    </p>
                  ) : null}
                  {item.note ? (
                    <p className="text-sm text-[color:var(--color-text-base)]">
                      <span className="font-medium text-[color:var(--color-text-strong)]">
                        {messages.share.itemFields.note}: 
                      </span>
                      {item.note}
                    </p>
                  ) : null}
                  {item.price ? (
                    <p className="text-sm text-[color:var(--color-text-base)]">
                      <span className="font-medium text-[color:var(--color-text-strong)]">
                        {messages.share.itemFields.price}: 
                      </span>
                      {item.price}
                    </p>
                  ) : null}
                  {item.reservation.status === "reserved" ? (
                    <p className="ui-note font-medium text-[color:var(--color-text-strong)]">
                      {messages.share.reservedLabel}
                    </p>
                  ) : publicWishlist.viewer.isAuthenticated && !publicWishlist.viewer.isOwner ? (
                    <form action={reservePublicWishlistItemAction}>
                      <input type="hidden" name="token" value={publicWishlist.shareLink.token} />
                      <input type="hidden" name="itemId" value={item.id} />
                      <button type="submit" className="ui-button">
                        {messages.share.reserveLabel}
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
}

async function reservePublicWishlistItemAction(formData: FormData) {
  "use server";

  const [{ getCurrentUser }, { createReservation }, { getPublicWishlistViewByShareToken }] =
    await Promise.all([
      import("@/modules/auth/server/current-user"),
      import("@/modules/reservation/server/lifecycle"),
      import("@/modules/share/server/public-wishlist"),
    ]);
  const user = await getCurrentUser();
  const token = getFormValue(formData, "token").trim();
  const itemId = getFormValue(formData, "itemId").trim();

  if (!user) {
    redirect("/login");
  }

  const sharePath = buildSharePath(token);
  const publicWishlist = await getPublicWishlistViewByShareToken(token, user.id);

  if (!publicWishlist) {
    redirect(`${sharePath}?action=reserve&error=invalid-share`);
  }

  const matchingItem = publicWishlist.items.find((item) => item.id === itemId);

  if (!matchingItem) {
    redirect(`${sharePath}?action=reserve&error=invalid-share`);
  }

  const result = await createReservation(user.id, itemId);

  if (result.status === "success") {
    redirect(`${sharePath}?status=reservation-created`);
  }

  switch (result.code) {
    case "already-reserved":
      redirect(`${sharePath}?action=reserve&error=already-reserved`);
    case "own-item":
      redirect(`${sharePath}?action=reserve&error=own-item`);
    case "item-not-found":
      redirect(`${sharePath}?action=reserve&error=invalid-share`);
    default:
      redirect(`${sharePath}?action=reserve&error=unknown`);
  }
}

function buildSharePath(token: string): string {
  return `/share/${encodeURIComponent(token)}`;
}

function getFormValue(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function getShareActionErrorMessage(action: string | undefined, errorCode: string): string {
  if (action !== "reserve") {
    return messages.share.errors.unknown;
  }

  switch (errorCode) {
    case "already-reserved":
      return messages.share.errors.alreadyReserved;
    case "own-item":
      return messages.share.errors.ownItem;
    case "invalid-share":
      return messages.share.errors.invalidShare;
    default:
      return messages.share.errors.unknown;
  }
}
