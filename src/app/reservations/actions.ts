import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth/server/current-user";
import { cancelReservation } from "@/modules/reservation";

export async function cancelReservationAction(formData: FormData) {
  "use server";

  const user = await requireCurrentUser();
  const reservationId = getFormValue(formData, "reservationId");
  const result = await cancelReservation(user.id, reservationId);

  if (result.status === "success") {
    redirect("/reservations?status=reservation-cancelled");
  }

  switch (result.code) {
    case "not-reservation-owner":
      redirect("/reservations?action=cancel&error=not-reservation-owner");
    case "reservation-not-found":
      redirect("/reservations?action=cancel&error=reservation-not-found");
    default:
      redirect("/reservations?action=cancel&error=unknown");
  }
}

function getFormValue(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}
