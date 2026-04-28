"use client";

import { useActionState, useOptimistic, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type ToggleStarredState, toggleStarredAction } from "@/app/_dashboard/item-actions";

export function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

type StarButtonProps = {
  itemId: string;
  wishlistId: string;
  starred: boolean;
  starLabel: string;
  unstarLabel: string;
};

export function StarButton({ itemId, wishlistId, starred, starLabel, unstarLabel }: StarButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, formAction] = useActionState<ToggleStarredState, FormData>(toggleStarredAction, null);
  const [optimisticStarred, setOptimisticStarred] = useOptimistic(starred);

  useEffect(() => {
    if (state?.status === "success") {
      startTransition(() => router.refresh());
    }
  }, [state]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      setOptimisticStarred((prev) => !prev);
      formAction(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "contents" }}>
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="wishlistId" value={wishlistId} />
      <button
        type="submit"
        className={`item-star-btn${optimisticStarred ? " item-star-btn--starred" : ""}`}
        aria-label={optimisticStarred ? unstarLabel : starLabel}
        aria-pressed={optimisticStarred}
      >
        <StarIcon filled={optimisticStarred} />
      </button>
    </form>
  );
}
