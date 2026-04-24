import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "@/modules/i18n";
import { reservePublicWishlistItemAction } from "@/app/share/[token]/actions";
import { formatPrice } from "@/app/format-price";

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
    starred: boolean;
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
      starred: true,
      reservation: { status: "available" },
    },
    {
      id: "mock-2",
      title: "Книга «Мастер и Маргарита»",
      url: null,
      note: null,
      price: "850 ₽",
      starred: false,
      reservation: { status: "reserved" },
    },
    {
      id: "mock-3",
      title: "Подарочная карта Ozon",
      url: "https://example.com/ozon-gift",
      note: "На любую сумму",
      price: null,
      starred: false,
      reservation: { status: "available" },
    },
  ],
};

export async function generateMetadata(props: SharePageProps): Promise<Metadata> {
  const params = props?.params ? await props.params : undefined;
  const token = params?.token ?? "";

  if (token && token !== "demo-token") {
    const { getPublicWishlistViewByShareToken } = await import("@/modules/share/server/public-wishlist");
    const wishlist = await getPublicWishlistViewByShareToken(token, undefined);

    if (wishlist) {
      const count = wishlist.items.length;
      return {
        title: "Публичный вишлист",
        description: count > 0
          ? `${count} ${pluralizeItems(count)} в вишлисте. Забронируй нужный подарок.`
          : "Вишлист пока пуст.",
        robots: { index: false },
      };
    }
  }

  return { robots: { index: false } };
}

function pluralizeItems(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "желание";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "желания";
  return "желаний";
}

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
              color: "var(--color-text-strong)",
              margin: 0,
            }}
          >
            {common.brand}
          </p>
          <h1 className="content-page-title">{messages.share.unavailableTitle}</h1>
        </div>
        <div
          className="ui-surface"
          style={{
            padding: "var(--space-6)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-4)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "var(--color-text-strong)",
              fontSize: "var(--font-size-label)",
              margin: 0,
            }}
          >
            {messages.share.unavailableHint}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <Link
              href="/"
              className="ui-button ui-button-secondary"
              style={{ background: "var(--color-bg-canvas)" }}
            >
              {messages.share.unavailableHomeLabel}
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
                  <div className="share-item-header-right">
                    {item.starred ? (
                      <span className="share-item-star" aria-label={messages.share.starredLabel}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                          strokeLinejoin="round" aria-hidden="true">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </span>
                    ) : null}
                    {item.reservation.status === "reserved" ? (
                      <span className="ui-badge ui-badge-reserved">
                        {messages.share.reservedLabel}
                      </span>
                    ) : null}
                  </div>
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
                wishlist.viewer.isAuthenticated ? (
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

function getShareActionErrorMessage(action: string | undefined, errorCode: string): string {
  if (action !== "reserve") {
    return messages.share.errors.unknown;
  }

  switch (errorCode) {
    case "already-reserved":
      return messages.share.errors.alreadyReserved;
    case "invalid-share":
      return messages.share.errors.invalidShare;
    default:
      return messages.share.errors.unknown;
  }
}
