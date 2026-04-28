"use client";

import { useEffect, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ReserveShareItemState } from "./actions";

function BookmarkIcon() {
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
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

type ShareReserveButtonProps = {
  itemId: string;
  token: string;
  reserveLabel: string;
  errorMessages: {
    alreadyReserved: string;
    invalidShare: string;
    unknown: string;
  };
  reserveAction: (
    prev: ReserveShareItemState,
    formData: FormData,
  ) => Promise<ReserveShareItemState>;
};

export function ShareReserveButton({
  itemId,
  token,
  reserveLabel,
  errorMessages,
  reserveAction,
}: ShareReserveButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, formAction] = useActionState(reserveAction, null);

  useEffect(() => {
    if (state?.status === "success") {
      startTransition(() => router.refresh());
    }
  }, [state]);

  function getErrorMessage(error: string | undefined): string {
    switch (error) {
      case "already-reserved":
        return errorMessages.alreadyReserved;
      case "invalid-share":
        return errorMessages.invalidShare;
      default:
        return errorMessages.unknown;
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {state?.status === "error" ? (
        <p className="ui-message ui-message-error" style={{ margin: 0 }}>
          {getErrorMessage(state.error)}
        </p>
      ) : null}
      <form action={formAction}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="itemId" value={itemId} />
        <button type="submit" className="item-reserve-btn">
          <BookmarkIcon />
          <span className="item-btn-label">{reserveLabel}</span>
        </button>
      </form>
    </div>
  );
}
