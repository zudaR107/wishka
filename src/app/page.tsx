import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getCurrentUser, requireCurrentUser } from "@/modules/auth/server/current-user";
import { getTranslations } from "@/modules/i18n";
import {
  getOrCreateShareLinkForWishlist,
  regenerateShareLinkForWishlist,
} from "@/modules/share";
import type { DeleteItemState, ReserveItemState, CancelItemReservationState, RegenerateState } from "./_dashboard/item-actions";
import { getAllOwnerWishlistsWithReservations, createReservation, cancelReservation } from "@/modules/reservation";
import { deleteCurrentWishlistItem } from "@/modules/wishlist/server/manage-item";
import { WishlistManager, type DashboardWishlist } from "./_dashboard/wishlist-manager";

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
  const [allWishlists, appOrigin] = await Promise.all([
    getAllOwnerWishlistsWithReservations(userId),
    getAppOrigin(),
  ]);

  const shareLinks = await Promise.all(
    allWishlists.map((w) => getOrCreateShareLinkForWishlist(w.id)),
  );

  const wishlistsData: DashboardWishlist[] = allWishlists.map((wishlist, i) => ({
    ...wishlist,
    shareUrl: shareLinks[i] ? buildShareUrl(appOrigin, shareLinks[i].token) : null,
  }));

  return (
    <div className="dashboard-page">
      <WishlistManager
        wishlists={wishlistsData}
        deleteItemAction={deleteItemAction}
        reserveItemAction={reserveItemAction}
        cancelItemReservationAction={cancelItemReservationAction}
        regenerateShareLinkAction={regenerateShareLinkAction}
      />
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
  const result = await deleteCurrentWishlistItem(
    user.id,
    getFormValue(formData, "wishlistId"),
    getFormValue(formData, "itemId"),
  );

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

async function regenerateShareLinkAction(
  prev: RegenerateState,
  formData: FormData,
): Promise<RegenerateState> {
  "use server";

  const user = await requireCurrentUser();

  try {
    await regenerateShareLinkForWishlist(getFormValue(formData, "wishlistId"), user.id);
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
