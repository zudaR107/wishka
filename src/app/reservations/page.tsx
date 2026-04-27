import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Бронирования",
  robots: { index: false },
};
import { requireCurrentUser } from "@/modules/auth/server/current-user";
import { getTranslations } from "@/modules/i18n";
import { listCurrentUserActiveReservations } from "@/modules/reservation";
import { cancelReservationAction } from "@/app/reservations/actions";
import { CancelReservationButton } from "@/app/reservations/cancel-reservation-button";
import { formatPrice } from "@/app/format-price";

const common = getTranslations("common");
const messages = getTranslations("app");

export default async function ReservationsPage() {
  const user = await requireCurrentUser();
  const reservations = await listCurrentUserActiveReservations(user.id);

  return (
    <div className="content-page">
      <div className="content-page-header">
        <p className="page-brand-label">{common.brand}</p>
        <h1 className="content-page-title">{messages.reservations.title}</h1>
        <p className="content-page-description">{messages.reservations.description}</p>
      </div>

      {reservations.length === 0 ? (
        <div className="dashboard-empty" data-testid="reservations-empty-state">
          <p className="dashboard-empty-title">{messages.reservations.emptyTitle}</p>
          <p className="dashboard-empty-description">{messages.reservations.emptyDescription}</p>
          <Link href="/" className="ui-button ui-button-secondary">
            {messages.reservations.emptyActionLabel}
          </Link>
        </div>
      ) : (
        <section>
          <p className="content-section-label">{messages.reservations.listTitle}</p>
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
            {reservations.map((reservation) => (
              <li
                key={reservation.id}
                className="reservation-card"
                data-testid="reservation-card"
              >
                <div className={`item-card-status ${reservation.isOwnItem ? "item-card-status-self-reserved" : "item-card-status-reserved"}`}>
                  <span className="item-card-status-dot" />
                  {messages.dashboard.itemReservation.reservedLabel}
                  {reservation.isOwnItem ? (
                    <span className="item-own-badge">
                      {messages.reservations.ownItemBadge}
                    </span>
                  ) : null}
                </div>
                <div className="reservation-card-body">
                  <h3 className="reservation-card-title">{reservation.item.title}</h3>
                  {(reservation.item.price || reservation.item.url || reservation.item.note) ? (
                    <div className="reservation-card-meta">
                      {reservation.item.price ? (
                        <span style={{ fontWeight: 600, color: "var(--color-text-strong)" }}>
                          {formatPrice(reservation.item.price)}
                        </span>
                      ) : null}
                      {reservation.item.url ? (
                        <a
                          href={reservation.item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="reservation-card-url"
                        >
                          {reservation.item.url}
                        </a>
                      ) : null}
                      {reservation.item.note ? (
                        <span style={{ color: "var(--color-text-muted)" }}>
                          {reservation.item.note}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <CancelReservationButton
                    reservationId={reservation.id}
                    cancelLabel={messages.reservations.cancelLabel}
                    errorMessages={{
                      notReservationOwner: messages.reservations.errors.notReservationOwner,
                      reservationNotFound: messages.reservations.errors.reservationNotFound,
                      unknown: messages.reservations.errors.unknown,
                    }}
                    cancelAction={cancelReservationAction}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
