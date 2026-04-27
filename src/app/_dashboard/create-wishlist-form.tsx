"use client";

import { useEffect, useRef, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getTranslations } from "@/modules/i18n";
import { createWishlistAction, type CreateWishlistState } from "./item-actions";

const messages = getTranslations("app");

type CreateWishlistFormProps = {
  onCreated: (wishlistId: string) => void;
  onCancel: () => void;
};

export function CreateWishlistForm({ onCreated, onCancel }: CreateWishlistFormProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction] = useActionState<CreateWishlistState, FormData>(
    createWishlistAction,
    null,
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state?.status === "success" && state.wishlistId) {
      onCreated(state.wishlistId);
      startTransition(() => router.refresh());
    }
  }, [state]);

  return (
    <form action={formAction} className="wishlist-edit-form">
      <input
        ref={inputRef}
        name="name"
        className="ui-input"
        placeholder={messages.dashboard.wishlists.createPlaceholder}
        maxLength={100}
        required
      />
      {state?.status === "error" ? (
        <p className="ui-message ui-message-error">
          {messages.dashboard.wishlists.errors.createUnknown}
        </p>
      ) : null}
      <div className="wishlist-edit-form-actions">
        <button type="submit" className="ui-button">
          {messages.dashboard.wishlists.createSubmitLabel}
        </button>
        <button type="button" className="ui-button ui-button-soft" onClick={onCancel}>
          {messages.dashboard.wishlists.createCancelLabel}
        </button>
      </div>
    </form>
  );
}
