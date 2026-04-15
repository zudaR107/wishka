import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, requireCurrentUser } from "@/modules/auth/server/current-user";
import { getTranslations } from "@/modules/i18n";
import {
  getCurrentShareLink,
  getOrCreateCurrentShareLink,
  regenerateCurrentShareLink,
  revokeCurrentShareLink,
} from "@/modules/share";
import { getCurrentOwnerWishlistWithReservations } from "@/modules/reservation";
import { createCurrentWishlistItem } from "@/modules/wishlist/server/create-item";
import {
  deleteCurrentWishlistItem,
  updateCurrentWishlistItem,
} from "@/modules/wishlist/server/manage-item";
import { PriceInput } from "@/shared/ui/price-input";

const common = getTranslations("common");
const messages = getTranslations("app");

const devLinks = [
  { href: "/login", label: messages.home.devLinks.login },
  { href: "/register", label: messages.home.devLinks.register },
  { href: "/", label: messages.home.devLinks.app },
  { href: "/reservations", label: messages.home.devLinks.reservations },
  { href: "/share/demo-token", label: messages.home.devLinks.share },
];

type RootPageProps = {
  searchParams?: Promise<{
    action?: string;
    status?: string;
    error?: string;
  }>;
};

export default async function RootPage(props: RootPageProps) {
  const user = await getCurrentUser();
  const isDev = process.env.NODE_ENV === "development";

  if (user) {
    return <DashboardView userId={user.id} searchParams={props.searchParams} />;
  }

  return (
    <>
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

async function DashboardView({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams?: Promise<{ action?: string; status?: string; error?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const [wishlist, currentShareLink, appOrigin] = await Promise.all([
    getCurrentOwnerWishlistWithReservations(userId),
    getCurrentShareLink(userId),
    getAppOrigin(),
  ]);
  const action = params?.action;
  const status = params?.status;
  const errorCode = params?.error;
  const currentShareUrl = currentShareLink
    ? buildShareUrl(appOrigin, currentShareLink.token)
    : null;

  return (
    <div className="dashboard-page">
      {/* Status messages */}
      {status === "item-created" ? (
        <p className="ui-message ui-message-success">{messages.dashboard.successMessage}</p>
      ) : status === "item-updated" ? (
        <p className="ui-message ui-message-success">{messages.dashboard.updateSuccessMessage}</p>
      ) : status === "item-deleted" ? (
        <p className="ui-message ui-message-success">{messages.dashboard.deleteSuccessMessage}</p>
      ) : status === "share-link-created" ? (
        <p className="ui-message ui-message-success">{messages.dashboard.share.successMessage}</p>
      ) : status === "share-link-revoked" ? (
        <p className="ui-message ui-message-success">
          {messages.dashboard.share.revokeSuccessMessage}
        </p>
      ) : status === "share-link-regenerated" ? (
        <p className="ui-message ui-message-success">
          {messages.dashboard.share.regenerateSuccessMessage}
        </p>
      ) : null}
      {errorCode ? (
        <p className="ui-message ui-message-error">{getActionErrorMessage(action, errorCode)}</p>
      ) : null}

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
        {currentShareUrl ? (
          <>
            <div className="share-url-row">
              <input
                id="share-link-url"
                data-testid="share-link-url"
                value={currentShareUrl}
                readOnly
                className="share-url-input"
                aria-label={messages.dashboard.share.urlLabel}
              />
            </div>
            <p className="ui-note">{messages.dashboard.share.copyHint}</p>
            <div className="share-panel-actions">
              <form action={revokeShareLinkAction}>
                <button type="submit" className="ui-button ui-button-danger">
                  {messages.dashboard.share.revokeLabel}
                </button>
              </form>
              <form action={regenerateShareLinkAction}>
                <button type="submit" className="ui-button ui-button-secondary">
                  {messages.dashboard.share.regenerateLabel}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div>
            <p className="ui-note" style={{ marginBottom: "var(--space-4)" }}>
              {messages.dashboard.share.emptyDescription}
            </p>
            <form action={createShareLinkAction}>
              <button type="submit" className="ui-button">
                {messages.dashboard.share.createLabel}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Add item collapsible */}
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
          <form
            action={createItemAction}
            className="ui-form"
            style={{ maxWidth: "none" }}
            id="wishlist-create-form"
            data-testid="wishlist-create-form"
          >
            <div className="ui-field">
              <label className="ui-label" htmlFor="title">
                {messages.dashboard.fields.title}
              </label>
              <input id="title" name="title" className="ui-input" required maxLength={255} />
            </div>
            <div className="ui-field">
              <label className="ui-label" htmlFor="url">
                {messages.dashboard.fields.url}
              </label>
              <input id="url" name="url" type="url" className="ui-input" maxLength={2048} />
              <p className="ui-note">{messages.dashboard.hints.url}</p>
            </div>
            <div className="ui-field">
              <label className="ui-label" htmlFor="note">
                {messages.dashboard.fields.note}
              </label>
              <textarea id="note" name="note" className="ui-input min-h-28 resize-y" maxLength={2000} />
            </div>
            <div className="ui-field">
              <label className="ui-label" htmlFor="price">
                {messages.dashboard.fields.price}
              </label>
              <PriceInput id="price" name="price" className="ui-input" />
            </div>
            <button type="submit" className="ui-button">
              {messages.dashboard.submitLabel}
            </button>
          </form>
        </div>
      </details>

      {/* Items list or empty state */}
      {wishlist.items.length === 0 ? (
        <div className="dashboard-empty" data-testid="wishlist-empty-state">
          <p className="dashboard-empty-title">{messages.dashboard.emptyTitle}</p>
          <p className="dashboard-empty-description">{messages.dashboard.emptyDescription}</p>
          <a href="#wishlist-create-form-panel" className="ui-button">
            {messages.dashboard.emptyActionLabel}
          </a>
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
                {/* Card view */}
                <div className="item-card-view">
                  <div className="item-card-top">
                    <h3 className="item-card-title">{item.title}</h3>
                    {item.reservation.status === "reserved" ? (
                      <span className="ui-badge ui-badge-reserved">
                        {messages.dashboard.itemReservation.reservedLabel}
                      </span>
                    ) : (
                      <span className="ui-badge ui-badge-available">
                        {messages.dashboard.itemReservation.availableLabel}
                      </span>
                    )}
                  </div>
                  {(item.price || item.url || item.note) ? (
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
                        <span className="item-card-note" style={{ width: "100%" }}>
                          {item.note}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* Inline edit toggle */}
                <details className="item-edit-details">
                  <summary className="item-edit-summary" data-testid="edit-item-toggle">
                    ✏ {messages.dashboard.editToggleLabel}
                  </summary>
                  <div className="item-edit-form-inner">
                    <form action={updateItemAction} className="ui-form" style={{ maxWidth: "none" }}>
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
                          maxLength={255}
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
                          maxLength={2048}
                        />
                        <p className="ui-note">{messages.dashboard.hints.url}</p>
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
                          maxLength={2000}
                        />
                      </div>
                      <div className="ui-field">
                        <label className="ui-label" htmlFor={`price-${item.id}`}>
                          {messages.dashboard.fields.price}
                        </label>
                        <PriceInput
                          id={`price-${item.id}`}
                          name="price"
                          defaultValue={item.price ? formatPrice(item.price) : ""}
                          className="ui-input"
                        />
                      </div>
                      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                        <button type="submit" className="ui-button">
                          {messages.dashboard.updateLabel}
                        </button>
                      </div>
                    </form>
                  </div>
                </details>

                {/* Delete action */}
                <div className="item-card-actions">
                  <form action={deleteItemAction}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <button type="submit" className="ui-button ui-button-danger">
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
  );
}

// ---------------------------------------------------------------------------
// Server actions
// ---------------------------------------------------------------------------

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
    redirect("/?status=item-created");
  }

  redirect(`/?action=create&error=${result.code}`);
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
    redirect("/?status=item-updated");
  }

  redirect(`/?action=update&error=${result.code}`);
}

async function deleteItemAction(formData: FormData) {
  "use server";

  const user = await requireCurrentUser();
  const result = await deleteCurrentWishlistItem(user.id, getFormValue(formData, "itemId"));

  if (result.status === "success") {
    redirect("/?status=item-deleted");
  }

  redirect(`/?action=delete&error=${result.code}`);
}

async function createShareLinkAction() {
  "use server";

  const user = await requireCurrentUser();

  try {
    await getOrCreateCurrentShareLink(user.id);
  } catch {
    redirect("/?action=share-create&error=unknown");
  }

  redirect("/?status=share-link-created");
}

async function revokeShareLinkAction() {
  "use server";

  const user = await requireCurrentUser();

  try {
    await revokeCurrentShareLink(user.id);
  } catch {
    redirect("/?action=share-revoke&error=unknown");
  }

  redirect("/?status=share-link-revoked");
}

async function regenerateShareLinkAction() {
  "use server";

  const user = await requireCurrentUser();

  try {
    await regenerateCurrentShareLink(user.id);
  } catch {
    redirect("/?action=share-regenerate&error=unknown");
  }

  redirect("/?status=share-link-regenerated");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
      if (action === "share-create") return messages.dashboard.share.errors.unknownCreate;
      if (action === "share-revoke") return messages.dashboard.share.errors.unknownRevoke;
      if (action === "share-regenerate") return messages.dashboard.share.errors.unknownRegenerate;
      if (action === "update") return messages.dashboard.errors.unknownUpdate;
      if (action === "delete") return messages.dashboard.errors.unknownDelete;
      return messages.dashboard.errors.unknownCreate;
  }
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

function formatPrice(price: string): string {
  const num = parseFloat(price);
  const amount = isNaN(num) ? price : String(Math.round(num));
  return `${amount} ${common.currencySymbol}`;
}

function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
