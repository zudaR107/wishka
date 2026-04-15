import Link from "next/link";
import { getTranslations } from "@/modules/i18n";
import { reservePublicWishlistItemAction } from "@/app/share/[token]/actions";

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

type WishlistView = {
  shareLink: { token: string };
  viewer: { isAuthenticated: boolean; isOwner: boolean };
  items: Array<{
    id: string;
    title: string;
    url: string | null;
    note: string | null;
    price: string | null;
    reservation: { status: "available" | "reserved" };
  }>;
};

const DEV_MOCK_WISHLIST: WishlistView = {
  shareLink: { token: "demo-token" },
  viewer: { isAuthenticated: false, isOwner: false },
  items: [
    {
      id: "mock-1",
      title: "Беспроводные наушники Sony WH-1000XM5",
      url: "https://example.com/sony-headphones",
      note: "Чёрного цвета, если есть возможность",
      price: "29 990 ₽",
      reservation: { status: "available" },
    },
    {
      id: "mock-2",
      title: "Книга «Мастер и Маргарита»",
      url: null,
      note: null,
      price: "850 ₽",
      reservation: { status: "reserved" },
    },
    {
      id: "mock-3",
      title: "Подарочная карта Ozon",
      url: "https://example.com/ozon-gift",
      note: "На любую сумму",
      price: null,
      reservation: { status: "available" },
    },
  ],
};

export default async function SharePage(props: SharePageProps) {
  const params = props?.params ? await props.params : undefined;
  const search = props?.searchParams ? await props.searchParams : undefined;
  const token = params?.token ?? "";

  if (process.env.NODE_ENV === "development" && token === "demo-token") {
    return (
      <SharePageView
        wishlist={DEV_MOCK_WISHLIST}
        status={undefined}
        errorCode={undefined}
        action={undefined}
      />
    );
  }

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
      <div className="share-unavailable">
        <div className="content-page-header">
          <p
            style={{
              fontSize: "var(--font-size-label)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--color-text-muted)",
              margin: 0,
            }}
          >
            {common.brand}
          </p>
          <h1 className="content-page-title">{messages.share.unavailableTitle}</h1>
          <p className="content-page-description">{messages.share.unavailableDescription}</p>
        </div>
        <div
          className="ui-surface"
          style={{
            padding: "var(--space-6)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <p
            style={{
              color: "var(--color-text-base)",
              fontSize: "var(--font-size-label)",
              margin: 0,
            }}
          >
            {messages.share.unavailableHint}
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <Link href="/" className="ui-button ui-button-secondary">
              {messages.share.unavailableHomeLabel}
            </Link>
            <Link href="/login" className="ui-button">
              {messages.share.loginToReserveLabel}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SharePageView
      wishlist={publicWishlist}
      status={status}
      errorCode={errorCode}
      action={action}
    />
  );
}

function SharePageView({
  wishlist,
  status,
  errorCode,
  action,
}: {
  wishlist: WishlistView;
  status: string | undefined;
  errorCode: string | undefined;
  action: string | undefined;
}) {
  return (
    <div className="content-page">
      <div className="content-page-header">
        <p
          style={{
            fontSize: "var(--font-size-label)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--color-text-muted)",
            margin: 0,
          }}
        >
          {common.brand}
        </p>
        <h1 className="content-page-title">{messages.share.title}</h1>
        <p className="content-page-description">{messages.share.description}</p>
      </div>

      {status === "reservation-created" ? (
        <p className="ui-message ui-message-success">{messages.share.successMessage}</p>
      ) : null}
      {errorCode ? (
        <p className="ui-message ui-message-error">
          {getShareActionErrorMessage(action, errorCode)}
        </p>
      ) : null}

      {!wishlist.viewer.isAuthenticated ? (
        <div className="ui-message ui-message-info" data-testid="share-guest-guard">
          <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--font-size-label)" }}>
            {messages.share.guestHint}
          </p>
          <Link href="/login" className="ui-button">
            {messages.share.loginToReserveLabel}
          </Link>
        </div>
      ) : wishlist.viewer.isOwner ? (
        <div className="ui-message ui-message-info">
          <p style={{ margin: 0, fontSize: "var(--font-size-label)" }}>
            {messages.share.ownerHint}
          </p>
        </div>
      ) : null}

      {wishlist.items.length === 0 ? (
        <div className="dashboard-empty">
          <p className="dashboard-empty-title">{messages.share.emptyTitle}</p>
          <p className="dashboard-empty-description">{messages.share.emptyDescription}</p>
        </div>
      ) : (
        <section>
          <p className="content-section-label">{messages.share.itemsTitle}</p>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
            }}
          >
            {wishlist.items.map((item) => (
              <li key={item.id} className="share-item-card" data-testid="share-item-card">
                <div className="share-item-header">
                  <h3 className="share-item-title">{item.title}</h3>
                  {item.reservation.status === "reserved" ? (
                    <span className="ui-badge ui-badge-reserved">
                      {messages.share.reservedLabel}
                    </span>
                  ) : null}
                </div>
                {item.price || item.url || item.note ? (
                  <div className="share-item-meta">
                    {item.price ? (
                      <span style={{ fontWeight: 600, color: "var(--color-text-strong)" }}>
                        {formatPrice(item.price)}
                      </span>
                    ) : null}
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="item-card-url"
                      >
                        {item.url}
                      </a>
                    ) : null}
                    {item.note ? (
                      <span style={{ color: "var(--color-text-muted)", width: "100%" }}>
                        {item.note}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {item.reservation.status !== "reserved" &&
                wishlist.viewer.isAuthenticated &&
                !wishlist.viewer.isOwner ? (
                  <form action={reservePublicWishlistItemAction}>
                    <input type="hidden" name="token" value={wishlist.shareLink.token} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <button type="submit" className="ui-button">
                      {messages.share.reserveLabel}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function formatPrice(price: string): string {
  const num = parseFloat(price);
  const amount = isNaN(num) ? price : String(Math.round(num));
  return `${amount} ${common.currencySymbol}`;
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
