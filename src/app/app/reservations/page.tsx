import { requireCurrentUser } from "@/modules/auth/server/current-user";
import { getTranslations } from "@/modules/i18n";
import { cancelReservation, listCurrentUserActiveReservations } from "@/modules/reservation";
import { redirect } from "next/navigation";
import { PageShell } from "@/shared/ui/page-shell";

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
    <PageShell
      eyebrow={common.routeSkeleton}
      title={messages.reservations.title}
      description={messages.reservations.description}
    >
      {status === "reservation-cancelled" ? (
        <p className="ui-message ui-message-success">{messages.reservations.cancelSuccessMessage}</p>
      ) : null}
      {errorCode ? (
        <p className="ui-message ui-message-error">
          {getReservationsActionErrorMessage(action, errorCode)}
        </p>
      ) : null}
      {reservations.length === 0 ? (
        <section className="ui-surface p-6">
          <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">
            {messages.reservations.emptyTitle}
          </h2>
          <p className="mt-3 text-[color:var(--color-text-base)]">
            {messages.reservations.emptyDescription}
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">
            {messages.reservations.listTitle}
          </h2>
          <ul className="space-y-4">
            {reservations.map((reservation) => (
              <li key={reservation.id} className="ui-surface p-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-[color:var(--color-text-strong)]">
                      {reservation.item.title}
                    </h3>
                    {reservation.item.url ? (
                      <p className="text-sm text-[color:var(--color-text-base)] break-all">
                        <span className="font-medium text-[color:var(--color-text-strong)]">
                          {messages.reservations.itemFields.url}: 
                        </span>
                        {reservation.item.url}
                      </p>
                    ) : null}
                    {reservation.item.note ? (
                      <p className="text-sm text-[color:var(--color-text-base)]">
                        <span className="font-medium text-[color:var(--color-text-strong)]">
                          {messages.reservations.itemFields.note}: 
                        </span>
                        {reservation.item.note}
                      </p>
                    ) : null}
                    {reservation.item.price ? (
                      <p className="text-sm text-[color:var(--color-text-base)]">
                        <span className="font-medium text-[color:var(--color-text-strong)]">
                          {messages.reservations.itemFields.price}: 
                        </span>
                        {reservation.item.price}
                      </p>
                    ) : null}
                  </div>
                  <form action={cancelReservationAction}>
                    <input type="hidden" name="reservationId" value={reservation.id} />
                    <button type="submit" className="ui-button">
                      {messages.reservations.cancelLabel}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
}

async function cancelReservationAction(formData: FormData) {
  "use server";

  const user = await requireCurrentUser();
  const reservationId = getFormValue(formData, "reservationId");
  const result = await cancelReservation(user.id, reservationId);

  if (result.status === "success") {
    redirect("/app/reservations?status=reservation-cancelled");
  }

  switch (result.code) {
    case "not-reservation-owner":
      redirect("/app/reservations?action=cancel&error=not-reservation-owner");
    case "reservation-not-found":
      redirect("/app/reservations?action=cancel&error=reservation-not-found");
    default:
      redirect("/app/reservations?action=cancel&error=unknown");
  }
}

function getFormValue(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
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
