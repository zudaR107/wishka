"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PriceInput } from "@/shared/ui/price-input";
import { getTranslations } from "@/modules/i18n";
import { updateItemAction, type ItemFormState } from "./item-actions";
import { useItemEditClose } from "./item-edit-section";

const messages = getTranslations("app");

type EditItemFormProps = {
  item: {
    id: string;
    title: string;
    url: string | null;
    note: string | null;
    priceFormatted: string;
    updatedAt: string;
  };
  wishlistId: string;
};

function getErrorMessage(code: string): string {
  switch (code) {
    case "invalid-title":
      return messages.dashboard.errors.invalidTitle;
    case "invalid-url":
      return messages.dashboard.errors.invalidUrl;
    case "invalid-price":
      return messages.dashboard.errors.invalidPrice;
    case "item-not-found":
      return messages.dashboard.errors.itemNotFound;
    default:
      return messages.dashboard.errors.unknownUpdate;
  }
}

export function EditItemForm({ item, wishlistId }: EditItemFormProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  // Tracks whether this is the first render so the reset effect skips mount.
  const isMountedRef = useRef(false);
  const [state, action] = useActionState<ItemFormState, FormData>(updateItemAction, null);
  const closeEditSection = useItemEditClose();

  const v = state?.values;
  const err = state?.status === "error" ? state.error : undefined;

  // On success: capture card ref before collapse, close, then scroll after repaint.
  useEffect(() => {
    if (state?.status !== "success") return;
    const card = formRef.current?.closest(".item-card") as HTMLElement | null;
    closeEditSection();
    // requestAnimationFrame fires after React collapses the form and repaints,
    // so scrollIntoView runs on the already-collapsed, shorter card.
    requestAnimationFrame(() => {
      (card ?? formRef.current)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    startTransition(() => router.refresh());
  }, [state]);

  // After router.refresh() delivers new RSC props (detected via updatedAt change),
  // reset native input values to the fresh defaults — no DOM re-mount, no flicker.
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    formRef.current?.reset();
  }, [item.updatedAt]);

  return (
    <>
      {err ? (
        <p className="ui-message ui-message-error" style={{ marginBottom: "var(--space-4)" }}>{getErrorMessage(err ?? "")}</p>
      ) : null}
      <form ref={formRef} action={action} className="ui-form" style={{ maxWidth: "none" }} noValidate>
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="wishlistId" value={wishlistId} />
        <div className="ui-field">
          <label className="ui-label" htmlFor={`title-${item.id}`}>
            {messages.dashboard.fields.title}
          </label>
          <input
            id={`title-${item.id}`}
            name="title"
            defaultValue={v?.title ?? item.title}
            className={err === "invalid-title" ? "ui-input ui-input-error" : "ui-input"}
            required
            maxLength={255}
            autoFocus={err === "invalid-title"}
          />
        </div>
        <div className="ui-field">
          <label className="ui-label" htmlFor={`url-${item.id}`}>
            {messages.dashboard.fields.url}
          </label>
          <input
            id={`url-${item.id}`}
            name="url"
            type="text"
            defaultValue={v?.url ?? item.url ?? ""}
            className={err === "invalid-url" ? "ui-input ui-input-error" : "ui-input"}
            maxLength={2048}
            autoFocus={err === "invalid-url"}
          />
          <p className="ui-note">{messages.dashboard.hints.url}</p>
        </div>
        <div className="ui-field">
          <label className="ui-label" htmlFor={`note-${item.id}`}>
            {messages.dashboard.fields.note}
          </label>
          <textarea
            id={`note-${item.id}`}
            name="note"
            defaultValue={v?.note ?? item.note ?? ""}
            className="ui-input min-h-28 resize-y"
            maxLength={2000}
          />
        </div>
        <div className="ui-field">
          <label className="ui-label" htmlFor={`price-${item.id}`}>
            {messages.dashboard.fields.price}
          </label>
          <PriceInput
            id={`price-${item.id}`}
            name="price"
            defaultValue={v?.price ?? item.priceFormatted}
            className="ui-input"
            autoFocus={err === "invalid-price"}
            error={err === "invalid-price"}
          />
        </div>
        <button type="submit" className="ui-button">
          {messages.dashboard.updateLabel}
        </button>
      </form>
    </>
  );
}
