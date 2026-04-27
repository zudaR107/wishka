"use client";

import { useRef, useEffect, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getTranslations } from "@/modules/i18n";
import { deleteWishlistAction, type DeleteWishlistState } from "./item-actions";

const messages = getTranslations("app");

function TrashIcon() {
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

type DeleteWishlistButtonProps = {
  wishlistId: string;
  disabled?: boolean;
};

export function DeleteWishlistButton({ wishlistId, disabled }: DeleteWishlistButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(deleteWishlistAction, null);

  useEffect(() => {
    if (state?.status === "success") {
      dialogRef.current?.close();
      startTransition(() => router.refresh());
    }
  }, [state]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) {
      dialogRef.current?.close();
    }
  }

  function getErrorMessage(code: string | undefined): string {
    switch (code) {
      case "last-wishlist":
        return messages.dashboard.wishlists.errors.deleteLastWishlist;
      case "not-found":
        return messages.dashboard.wishlists.errors.deleteNotFound;
      default:
        return messages.dashboard.wishlists.errors.deleteUnknown;
    }
  }

  return (
    <>
      <button
        type="button"
        className="ui-button ui-button-danger"
        onClick={() => dialogRef.current?.showModal()}
        disabled={disabled}
        title={messages.dashboard.wishlists.deleteLabel}
        aria-label={messages.dashboard.wishlists.deleteLabel}
      >
        <TrashIcon />
        <span className="wishlist-btn-label">{messages.dashboard.wishlists.deleteLabel}</span>
      </button>

      <dialog ref={dialogRef} className="confirm-dialog" onClick={handleBackdropClick}>
        <div className="confirm-dialog-inner">
          <h2 className="confirm-dialog-title">
            {messages.dashboard.wishlists.deleteConfirmTitle}
          </h2>
          <p className="confirm-dialog-description">
            {messages.dashboard.wishlists.deleteConfirmDescription}
          </p>
          {state?.status === "error" ? (
            <p className="ui-message ui-message-error">{getErrorMessage(state.error)}</p>
          ) : null}
          <div className="confirm-dialog-actions">
            <form action={formAction}>
              <input type="hidden" name="wishlistId" value={wishlistId} />
              <button type="submit" className="ui-button ui-button-danger">
                {messages.dashboard.wishlists.deleteConfirmLabel}
              </button>
            </form>
            <button
              type="button"
              className="ui-button ui-button-soft"
              onClick={() => dialogRef.current?.close()}
            >
              {messages.dashboard.wishlists.deleteCancelLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
