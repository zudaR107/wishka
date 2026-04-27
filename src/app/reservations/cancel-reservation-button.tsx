"use client";

import { useEffect, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CancelReservationState } from "./actions";

type CancelReservationButtonProps = {
  reservationId: string;
  cancelLabel: string;
  errorMessages: {
    notReservationOwner: string;
    reservationNotFound: string;
    unknown: string;
  };
  cancelAction: (
    prev: CancelReservationState,
    formData: FormData,
  ) => Promise<CancelReservationState>;
};

export function CancelReservationButton({
  reservationId,
  cancelLabel,
  errorMessages,
  cancelAction,
}: CancelReservationButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, formAction] = useActionState(cancelAction, null);

  useEffect(() => {
    if (state?.status === "success") {
      startTransition(() => router.refresh());
    }
  }, [state]);

  function getErrorMessage(error: string | undefined): string {
    switch (error) {
      case "not-reservation-owner":
        return errorMessages.notReservationOwner;
      case "reservation-not-found":
        return errorMessages.reservationNotFound;
      default:
        return errorMessages.unknown;
    }
  }

  return (
    <>
      {state?.status === "error" ? (
        <p className="ui-message ui-message-error" style={{ margin: "0 0 var(--space-3)" }}>
          {getErrorMessage(state.error)}
        </p>
      ) : null}
      <form action={formAction}>
        <input type="hidden" name="reservationId" value={reservationId} />
        <button type="submit" className="ui-button ui-button-danger">
          {cancelLabel}
        </button>
      </form>
    </>
  );
}
