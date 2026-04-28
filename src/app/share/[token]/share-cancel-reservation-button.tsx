"use client";

import { useEffect, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CancelShareReservationState } from "./actions";

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

type ShareCancelReservationButtonProps = {
  reservationId: string;
  cancelLabel: string;
  cancelAction: (
    prev: CancelShareReservationState,
    formData: FormData,
  ) => Promise<CancelShareReservationState>;
};

export function ShareCancelReservationButton({
  reservationId,
  cancelLabel,
  cancelAction,
}: ShareCancelReservationButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, formAction] = useActionState(cancelAction, null);

  useEffect(() => {
    if (state?.status === "success") {
      startTransition(() => router.refresh());
    }
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="reservationId" value={reservationId} />
      <button type="submit" className="item-cancel-reservation-btn">
        <XIcon />
        <span className="item-btn-label">{cancelLabel}</span>
      </button>
    </form>
  );
}
