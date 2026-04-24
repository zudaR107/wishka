import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getCurrentUser, requireCurrentUser } from "@/modules/auth/server/current-user";
import { getTranslations } from "@/modules/i18n";
import {
  getOrCreateCurrentShareLink,
  regenerateCurrentShareLink,
} from "@/modules/share";
import type { DeleteItemState, RegenerateState, ReserveItemState, CancelItemReservationState } from "./_dashboard/item-actions";
import { StarButton } from "./_dashboard/star-item-button";
import { getCurrentOwnerWishlistWithReservations, createReservation, cancelReservation } from "@/modules/reservation";
import { deleteCurrentWishlistItem } from "@/modules/wishlist/server/manage-item";
import { OpenFormButton, AddItemFormFocus } from "./_dashboard/open-form-button";
import { DeleteItemButton } from "./_dashboard/delete-item-button";
import { ReserveItemButton } from "./_dashboard/reserve-item-button";
import { CancelItemReservationButton } from "./_dashboard/cancel-item-reservation-button";
import { ItemEditSection } from "./_dashboard/item-edit-section";
import { CopyUrlButton } from "./_dashboard/copy-url-button";
import { CreateItemForm } from "./_dashboard/create-item-form";
import { EditItemForm } from "./_dashboard/edit-item-form";
import { RegenerateLinkButton } from "./_dashboard/regenerate-link-button";
import { formatPrice } from "./format-price";

const common = getTranslations("common");
const messages = getTranslations("app");

const devLinks = [
  { href: "/login", label: messages.home.devLinks.login },
  { href: "/register", label: messages.home.devLinks.register },
  { href: "/", label: messages.home.devLinks.app },
  { href: "/reservations", label: messages.home.devLinks.reservations },
  { href: "/share/demo-token", label: messages.home.devLinks.share },
];

export const metadata: Metadata = {
  title: "WSHKA — вишлист с бронированием подарков",
  description: "Создай список желаний, отправь ссылку близким — и получи именно то, о чём мечтал. Каждый видит, что уже забронировано.",
};

export default async function RootPage() {
  const user = await getCurrentUser();
  const isDev = process.env.NODE_ENV === "development";

  if (user) {
    return <DashboardView userId={user.id} />;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "WSHKA",
    url: "https://wshka.ru",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description: "Создай список желаний, поделись ссылкой — близкие забронируют подарки без спойлеров.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
    inLanguage: "ru",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <h1 className="home-hero-title">{messages.home.heroTitle}</h1>
          <p className="home-hero-description">{messages.home.heroDescription}</p>
          <div className="home-hero-actions">
            <Link href="/register" className="ui-button home-hero-cta">
              {messages.home.ctaRegister}
            </Link>
            <Link href="/login" className="ui-button ui-button-secondary home-hero-cta">
              {messages.home.ctaLogin}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="home-section-inner">
          <h2 className="home-section-title">{messages.home.featuresTitle}</h2>
          <ul className="home-features-grid">
            {messages.home.features.map((feature) => (
              <li key={feature.title} className="home-feature-card">
                <span className="home-feature-icon">{feature.icon}</span>
                <h3 className="home-feature-title">{feature.title}</h3>
                <p className="home-feature-description">{feature.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Dev block — only in development */}
      {isDev ? (
        <section className="home-section-inner home-dev-section">
          <div className="home-dev-card">
            <div className="home-dev-header">
              <span className="home-dev-badge">DEV</span>
              <div>
                <h2 className="home-dev-title">{messages.home.devTitle}</h2>
                <p className="home-dev-description">{messages.home.devDescription}</p>
              </div>
            </div>
            <ul className="home-dev-links">
              {devLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="home-dev-link">
                    {link.label}
                    <span className="home-dev-link-path">{link.href}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Dashboard view (shown when user is logged in)
// ---------------------------------------------------------------------------

async function DashboardView({ userId }: { userId: string }) {
  const [wishlist, currentShareLink, appOrigin] = await Promise.all([
    getCurrentOwnerWishlistWithReservations(userId),
    getOrCreateCurrentShareLink(userId),
    getAppOrigin(),
  ]);
  const currentShareUrl = currentShareLink
    ? buildShareUrl(appOrigin, currentShareLink.token)
    : null;

  return (
    <div className="dashboard-page">
      {/* Page header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">{messages.dashboard.title}</h1>
        <span className="dashboard-count" data-testid="wishlist-item-count">
          {wishlist.items.length} {pluralize(wishlist.items.length, messages.dashboard.itemCountForms)}
        </span>
      </div>

      {/* Share link panel */}
      <div className="share-panel">
        <div>
          <h2 className="share-panel-title">{messages.dashboard.share.title}</h2>
          <p className="share-panel-description">{messages.dashboard.share.description}</p>
        </div>
        <div className="share-url-row">
          <input
            id="share-link-url"
            data-testid="share-link-url"
            value={currentShareUrl ?? ""}
            readOnly
            className="share-url-input"
            aria-label={messages.dashboard.share.urlLabel}
          />
          {currentShareUrl ? <CopyUrlButton url={currentShareUrl} /> : null}
        </div>
        <p className="ui-note">{messages.dashboard.share.copyHint}</p>
        <div className="share-panel-actions">
          <RegenerateLinkButton
            regenerateAction={regenerateShareLinkAction}
            labels={{
              regenerateLabel: messages.dashboard.share.regenerateLabel,
              confirmTitle: messages.dashboard.share.regenerateConfirmTitle,
              confirmDescription: messages.dashboard.share.regenerateConfirmDescription,
              confirmLabel: messages.dashboard.share.regenerateConfirmLabel,
              cancelLabel: messages.dashboard.share.regenerateCancelLabel,
            }}
          />
        </div>
      </div>

      {/* Add item collapsible */}
      <AddItemFormFocus formId="wishlist-create-form-panel" inputName="title" />
      <details className="add-item-details" id="wishlist-create-form-panel">
        <summary className="add-item-summary" data-testid="add-item-toggle">
          <span>{messages.dashboard.addItemToggleLabel}</span>
        </summary>
        <div className="add-item-form-inner">
          <p
            style={{
              fontSize: "var(--font-size-label)",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-5)",
            }}
          >
            {messages.dashboard.formDescription}
          </p>
          <CreateItemForm />
        </div>
      </details>

      {/* Items list or empty state */}
      {wishlist.items.length === 0 ? (
        <div className="dashboard-empty" data-testid="wishlist-empty-state">
          <p className="dashboard-empty-title">{messages.dashboard.emptyTitle}</p>
          <p className="dashboard-empty-description">{messages.dashboard.emptyDescription}</p>
          <OpenFormButton formId="wishlist-create-form-panel" inputName="title" className="ui-button">
            {messages.dashboard.emptyActionLabel}
          </OpenFormButton>
        </div>
      ) : (
        <section>
          <h2
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 var(--space-3)",
            }}
          >
            {messages.dashboard.itemsTitle}
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {wishlist.items.map((item) => (
              <li key={item.id} className="item-card">
                {/* Status strip */}
                {item.reservation.status === "reserved" ? (
                  <div className={`item-card-status ${item.reservation.isOwn ? "item-card-status-self-reserved" : "item-card-status-reserved"}`}>
                    <span className="item-card-status-dot" />
                    {item.reservation.isOwn
                      ? messages.dashboard.itemReservation.selfReservedLabel
                      : messages.dashboard.itemReservation.reservedLabel}
                  </div>
                ) : (
                  <div className="item-card-status item-card-status-available">
                    <span className="item-card-status-dot" />
                    {messages.dashboard.itemReservation.availableLabel}
                  </div>
                )}

                {/* Card view */}
                <div className="item-card-view">
                  <div className="item-card-top">
                    <div className="item-card-top-left">
                      <h3 className="item-card-title">{item.title}</h3>
                      {(item.price || item.url || item.note) ? (
                        <div className="item-card-meta">
                          {item.price ? (
                            <span className="item-card-price">{formatPrice(item.price)}</span>
                          ) : null}
                          {item.url ? (
                            <span className="item-card-url-row">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="item-card-url"
                              >
                                {item.url}
                              </a>
                              <CopyUrlButton url={item.url} />
                            </span>
                          ) : null}
                          {item.note ? (
                            <span className="item-card-note">{item.note}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="item-card-top-right">
                      <StarButton
                        itemId={item.id}
                        starred={item.starred}
                        starLabel={messages.dashboard.starLabel}
                        unstarLabel={messages.dashboard.unstarLabel}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer: edit toggle + reserve + delete */}
                <ItemEditSection
                  editLabel={messages.dashboard.editToggleLabel}
                  reserveButton={
                    item.reservation.status === "available" ? (
                      <ReserveItemButton
                        itemId={item.id}
                        reserveLabel={messages.dashboard.reserveLabel}
                        reserveAction={reserveItemAction}
                      />
                    ) : item.reservation.isOwn ? (
                      <CancelItemReservationButton
                        reservationId={item.reservation.reservationId}
                        cancelLabel={messages.dashboard.cancelReservationLabel}
                        cancelAction={cancelItemReservationAction}
                      />
                    ) : undefined
                  }
                  deleteButton={
                    <DeleteItemButton
                      itemId={item.id}
                      itemTitle={item.title}
                      deleteAction={deleteItemAction}
                      labels={{
                        deleteLabel: messages.dashboard.deleteLabel,
                        confirmTitle: messages.dashboard.deleteConfirmTitle,
                        confirmDescription: messages.dashboard.deleteConfirmDescription,
                        confirmLabel: messages.dashboard.deleteConfirmLabel,
                        cancelLabel: messages.dashboard.deleteCancelLabel,
                      }}
                    />
                  }
                >
                  <EditItemForm
                    item={{
                      id: item.id,
                      title: item.title,
                      url: item.url,
                      note: item.note,
                      priceFormatted: item.price ?? "",
                      updatedAt: item.updatedAt.toISOString(),
                    }}
                  />
                </ItemEditSection>

              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Server actions
// ---------------------------------------------------------------------------

async function deleteItemAction(
  prev: DeleteItemState,
  formData: FormData,
): Promise<DeleteItemState> {
  "use server";

  const user = await requireCurrentUser();
  const result = await deleteCurrentWishlistItem(user.id, getFormValue(formData, "itemId"));

  if (result.status === "success") return { status: "success" };
  return { status: "error", error: result.code };
}

async function reserveItemAction(
  prev: ReserveItemState,
  formData: FormData,
): Promise<ReserveItemState> {
  "use server";

  const user = await requireCurrentUser();
  const result = await createReservation(user.id, getFormValue(formData, "itemId"));

  if (result.status === "success") return { status: "success" };
  return { status: "error", error: result.code };
}

async function cancelItemReservationAction(
  prev: CancelItemReservationState,
  formData: FormData,
): Promise<CancelItemReservationState> {
  "use server";

  const user = await requireCurrentUser();
  const result = await cancelReservation(user.id, getFormValue(formData, "reservationId"));

  if (result.status === "success") return { status: "success" };
  return { status: "error", error: result.code };
}

async function regenerateShareLinkAction(prev: RegenerateState): Promise<RegenerateState> {
  "use server";

  const user = await requireCurrentUser();

  try {
    await regenerateCurrentShareLink(user.id);
    return { status: "success" };
  } catch {
    return { status: "error" };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFormValue(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}


async function getAppOrigin(): Promise<string> {
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (!host) {
    return "http://localhost:3000";
  }

  return `${forwardedProto ?? "http"}://${host}`;
}

function buildShareUrl(origin: string, token: string): string {
  return new URL(`/share/${token}`, origin).toString();
}

function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
