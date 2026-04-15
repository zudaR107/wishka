import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth/server/current-user";
import { getTranslations } from "@/modules/i18n";
import { listCurrentUserActiveReservations } from "@/modules/reservation";
import { cancelReservationAction } from "@/app/reservations/actions";

const common = getTranslations("common");
const messages = getTranslations("app");

type ReservationsPageProps = {
  searchParams?: Promise<{
    action?: string;
    status?: string;
    error?: string;
  }>;
};

export default async function ReservationsPage(props: ReservationsPageProps) {
  const user = await requireCurrentUser();
  const params = props?.searchParams ? await props.searchParams : undefined;
  const reservations = await listCurrentUserActiveReservations(user.id);
  const action = params?.action;
  const status = params?.status;
  const errorCode = params?.error;

  return (
    <div className="content-page">
      <div className="content-page-header">
        <h1 className="content-page-title">{messages.reservations.title}</h1>
        <p className="content-page-description">{messages.reservations.description}</p>
      </div>

      {status === "reservation-cancelled" ? (
        <p className="ui-message ui-message-success">
          {messages.reservations.cancelSuccessMessage}
        </p>
      ) : null}
      {errorCode ? (
        <p className="ui-message ui-message-error">
          {getReservationsActionErrorMessage(action, errorCode)}
        </p>
      ) : null}

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
                <form action={cancelReservationAction}>
                  <input type="hidden" name="reservationId" value={reservation.id} />
                  <button type="submit" className="ui-button ui-button-danger">
                    {messages.reservations.cancelLabel}
                  </button>
                </form>
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

function getReservationsActionErrorMessage(action: string | undefined, errorCode: string): string {
  if (action !== "cancel") {
    return messages.reservations.errors.unknown;
  }

  switch (errorCode) {
    case "not-reservation-owner":
      return messages.reservations.errors.notReservationOwner;
    case "reservation-not-found":
      return messages.reservations.errors.reservationNotFound;
    default:
      return messages.reservations.errors.unknown;
  }
}
