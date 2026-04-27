"use client";

import { useEffect, useRef, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getTranslations } from "@/modules/i18n";
import { renameWishlistAction, type RenameWishlistState } from "./item-actions";

const messages = getTranslations("app");

type RenameWishlistFormProps = {
  wishlistId: string;
  currentName: string;
  onCancel: () => void;
};

export function RenameWishlistForm({ wishlistId, currentName, onCancel }: RenameWishlistFormProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction] = useActionState<RenameWishlistState, FormData>(
    renameWishlistAction,
    null,
  );

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    if (state?.status === "success") {
      onCancel();
      startTransition(() => router.refresh());
    }
  }, [state]);

  function getErrorMessage(code: string | undefined): string {
    switch (code) {
      case "not-found":
        return messages.dashboard.wishlists.errors.renameNotFound;
      default:
        return messages.dashboard.wishlists.errors.renameUnknown;
    }
  }

  return (
    <form action={formAction} className="wishlist-edit-form">
      <input type="hidden" name="wishlistId" value={wishlistId} />
      <input
        ref={inputRef}
        name="name"
        className="ui-input"
        defaultValue={currentName}
        maxLength={100}
        placeholder={messages.dashboard.wishlists.renamePlaceholder}
        required
      />
      {state?.status === "error" ? (
        <p className="ui-message ui-message-error">{getErrorMessage(state.error)}</p>
      ) : null}
      <div className="wishlist-edit-form-actions">
        <button type="submit" className="ui-button">
          {messages.dashboard.wishlists.renameSubmitLabel}
        </button>
        <button type="button" className="ui-button ui-button-soft" onClick={onCancel}>
          {messages.dashboard.wishlists.renameCancelLabel}
        </button>
      </div>
    </form>
  );
}
