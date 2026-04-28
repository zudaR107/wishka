"use server";

import { requireCurrentUser } from "@/modules/auth/server/current-user";
import { cancelReservation } from "@/modules/reservation";

export type CancelReservationState = {
  status: "success" | "error";
  error?: string;
} | null;

export async function cancelReservationAction(
  _prev: CancelReservationState,
  formData: FormData,
): Promise<CancelReservationState> {
  const user = await requireCurrentUser();
  const reservationId = getFormValue(formData, "reservationId");
  const result = await cancelReservation(user.id, reservationId);

  if (result.status === "success") {
    return { status: "success" };
  }

  return { status: "error", error: result.code };
}

function getFormValue(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value : "";
}
