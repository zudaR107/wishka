import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "@/modules/i18n";
import {
  reserveShareItemAction,
  cancelShareReservationAction,
  type ReserveShareItemState,
  type CancelShareReservationState,
} from "@/app/share/[token]/actions";
import { ShareReserveButton } from "@/app/share/[token]/share-reserve-button";
import { ShareCancelReservationButton } from "@/app/share/[token]/share-cancel-reservation-button";
import { formatPrice } from "@/app/format-price";

const common = getTranslations("common");
const messages = getTranslations("app");

type SharePageProps = {
  params?: Promise<{
    token?: string;
  }>;
};

type ItemReservation =
  | { status: "available" }
  | { status: "reserved"; isViewerReservation: boolean; reservationId: string };

type WishlistView = {
  shareLink: { token: string };
  viewer: { isAuthenticated: boolean; isOwner: boolean };
  owner: { email: string; bio: string | null };
  items: Array<{
    id: string;
    title: string;
    url: string | null;
    note: string | null;
    price: string | null;
    starred: boolean;
    reservation: ItemReservation;
  }>;
};

const DEV_MOCK_WISHLIST: WishlistView = {
  shareLink: { token: "demo-token" },
  viewer: { isAuthenticated: true, isOwner: false },
  owner: {
    email: "demo@example.com",
    bio: "Люблю книги, путешествия и хорошие наушники. Подарки принимаю в любое время года 🎁",
  },
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
      reservation: {
        status: "reserved",
        isViewerReservation: true,
        reservationId: "mock-reservation-1",
      },
    },
    {
      id: "mock-3",
      title: "Подарочная карта Ozon",
      url: "https://example.com/ozon-gift",
      note: "На любую сумму",
      price: null,
      starred: false,
      reservation: {
        status: "reserved",
        isViewerReservation: false,
        reservationId: "mock-reservation-2",
      },
    },
  ],
};

export async function generateMetadata(props: SharePageProps): Promise<Metadata> {
  const params = props?.params ? await props.params : undefined;
  const token = params?.token ?? "";

  if (token && token !== "demo-token") {
    const { getPublicWishlistViewByShareToken } = await import(
      "@/modules/share/server/public-wishlist"
    );
    const wishlist = await getPublicWishlistViewByShareToken(token, undefined);

    if (wishlist) {
      const count = wishlist.items.length;
      return {
        title: "Публичный вишлист",
        description:
          count > 0
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
  const token = params?.token ?? "";

  if (process.env.NODE_ENV === "development" && token === "demo-token") {
    return (
      <SharePageView
        wishlist={DEV_MOCK_WISHLIST}
        reserveAction={reserveShareItemAction}
        cancelAction={cancelShareReservationAction}
      />
    );
  }

  const [{ getCurrentUser }, { getPublicWishlistViewByShareToken }] = await Promise.all([
    import("@/modules/auth/server/current-user"),
    import("@/modules/share/server/public-wishlist"),
  ]);
  const currentUser = await getCurrentUser();
  const publicWishlist = await getPublicWishlistViewByShareToken(token, currentUser?.id);

  if (!publicWishlist) {
    return (
      <div className="share-unavailable">
        <div className="content-page-header">
          <p className="page-brand-label">{common.brand}</p>
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "var(--space-3)",
              flexWrap: "wrap",
            }}
          >
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
      reserveAction={reserveShareItemAction}
      cancelAction={cancelShareReservationAction}
    />
  );
}

function SharePageView({
  wishlist,
  reserveAction,
  cancelAction,
}: {
  wishlist: WishlistView;
  reserveAction: (
    prev: ReserveShareItemState,
    formData: FormData,
  ) => Promise<ReserveShareItemState>;
  cancelAction: (
    prev: CancelShareReservationState,
    formData: FormData,
  ) => Promise<CancelShareReservationState>;
}) {
  return (
    <div className="content-page">
      <div className="content-page-header">
        <p className="page-brand-label">{common.brand}</p>
        <div className="share-page-title-row">
          <h1 className="content-page-title">{messages.share.title}</h1>
          <span className="share-page-owner-email">{wishlist.owner.email}</span>
        </div>
        <p className="content-page-description">{messages.share.description}</p>
      </div>

      {wishlist.viewer.isAuthenticated && wishlist.owner.bio ? (
        <div className="share-owner-card" data-testid="share-owner-card">
          <p className="content-section-label">{messages.share.ownerSection}</p>
          <p className="share-owner-bio">{wishlist.owner.bio}</p>
        </div>
      ) : null}

      {!wishlist.viewer.isAuthenticated ? (
        <div className="ui-message ui-message-info" data-testid="share-guest-guard">
          <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--font-size-label)" }}>
            {messages.share.guestHint}
          </p>
          <Link
            href={`/login?next=/share/${encodeURIComponent(wishlist.shareLink.token)}`}
            className="ui-button"
          >
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
            {wishlist.items.map((item) => {
              const isViewerReservation =
                item.reservation.status === "reserved" && item.reservation.isViewerReservation;

              const statusClass =
                item.reservation.status === "reserved"
                  ? isViewerReservation
                    ? "item-card-status-self-reserved"
                    : "item-card-status-reserved"
                  : "item-card-status-available";

              const statusLabel =
                item.reservation.status === "reserved"
                  ? isViewerReservation
                    ? messages.dashboard.itemReservation.selfReservedLabel
                    : messages.dashboard.itemReservation.reservedLabel
                  : messages.dashboard.itemReservation.availableLabel;

              return (
                <li key={item.id} className="item-card" data-testid="share-item-card">
                  {/* Status strip */}
                  <div className={`item-card-status ${statusClass}`}>
                    <span className="item-card-status-dot" />
                    {statusLabel}
                  </div>

                  {/* Card body */}
                  <div className="item-card-view">
                    <div className="item-card-top">
                      <div className="item-card-top-left">
                        <h3 className="item-card-title">{item.title}</h3>
                        {item.price || item.url || item.note ? (
                          <div className="item-card-meta">
                            {item.price ? (
                              <span className="item-card-price">{formatPrice(item.price)}</span>
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
                              <span className="item-card-note">{item.note}</span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      {item.starred ? (
                        <div className="item-card-top-right">
                          <span
                            className="share-item-star"
                            aria-label={messages.share.starredLabel}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Footer: reserve or cancel */}
                  {wishlist.viewer.isAuthenticated ? (
                    item.reservation.status === "available" ? (
                      <div className="item-card-footer">
                        <div className="item-footer-start">
                          <ShareReserveButton
                            itemId={item.id}
                            token={wishlist.shareLink.token}
                            reserveLabel={messages.share.reserveLabel}
                            errorMessages={{
                              alreadyReserved: messages.share.errors.alreadyReserved,
                              invalidShare: messages.share.errors.invalidShare,
                              unknown: messages.share.errors.unknown,
                            }}
                            reserveAction={reserveAction}
                          />
                        </div>
                      </div>
                    ) : isViewerReservation ? (
                      <div className="item-card-footer">
                        <div className="item-footer-start">
                          <ShareCancelReservationButton
                            reservationId={item.reservation.reservationId}
                            cancelLabel={messages.dashboard.cancelReservationLabel}
                            cancelAction={cancelAction}
                          />
                        </div>
                      </div>
                    ) : null
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
