"use client";

import { useEffect, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ReserveItemState } from "./item-actions";

function BookmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

type ReserveItemButtonProps = {
  itemId: string;
  reserveLabel: string;
  reserveAction: (prev: ReserveItemState, formData: FormData) => Promise<ReserveItemState>;
};

export function ReserveItemButton({
  itemId,
  reserveLabel,
  reserveAction,
}: ReserveItemButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, formAction] = useActionState(reserveAction, null);

  useEffect(() => {
    if (state?.status === "success") {
      startTransition(() => router.refresh());
    }
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="itemId" value={itemId} />
      <button type="submit" className="item-reserve-btn">
        <BookmarkIcon />
        <span className="item-btn-label">{reserveLabel}</span>
      </button>
    </form>
  );
}
