"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PriceInput } from "@/shared/ui/price-input";
import { getTranslations } from "@/modules/i18n";
import { createItemAction, type ItemFormState } from "./item-actions";

const messages = getTranslations("app");

function getErrorMessage(code: string): string {
  switch (code) {
    case "invalid-title":
      return messages.dashboard.errors.invalidTitle;
    case "invalid-url":
      return messages.dashboard.errors.invalidUrl;
    case "invalid-price":
      return messages.dashboard.errors.invalidPrice;
    default:
      return messages.dashboard.errors.unknownCreate;
  }
}

export function CreateItemForm() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, action] = useActionState<ItemFormState, FormData>(createItemAction, null);
  const err = state?.status === "error" ? state.error : undefined;

  useEffect(() => {
    if (state?.status === "success") startTransition(() => router.refresh());
  }, [state]);

  return (
    <>
      {state?.status === "success" ? (
        <p className="ui-message ui-message-success">{messages.dashboard.successMessage}</p>
      ) : err ? (
        <p className="ui-message ui-message-error">{getErrorMessage(err ?? "")}</p>
      ) : null}
      <form
        key={state?.key ?? 0}
        action={action}
        className="ui-form"
        style={{ maxWidth: "none" }}
        id="wishlist-create-form"
        data-testid="wishlist-create-form"
        noValidate
      >
        <div className="ui-field">
          <label className="ui-label" htmlFor="title">
            {messages.dashboard.fields.title}
          </label>
          <input
            id="title"
            name="title"
            className={err === "invalid-title" ? "ui-input ui-input-error" : "ui-input"}
            required
            maxLength={255}
            defaultValue={state?.values?.title ?? ""}
            autoFocus={err === "invalid-title"}
          />
        </div>
        <div className="ui-field">
          <label className="ui-label" htmlFor="url">
            {messages.dashboard.fields.url}
          </label>
          <input
            id="url"
            name="url"
            type="text"
            className={err === "invalid-url" ? "ui-input ui-input-error" : "ui-input"}
            maxLength={2048}
            defaultValue={state?.values?.url ?? ""}
            autoFocus={err === "invalid-url"}
          />
          <p className="ui-note">{messages.dashboard.hints.url}</p>
        </div>
        <div className="ui-field">
          <label className="ui-label" htmlFor="note">
            {messages.dashboard.fields.note}
          </label>
          <textarea
            id="note"
            name="note"
            className="ui-input min-h-28 resize-y"
            maxLength={2000}
            defaultValue={state?.values?.note ?? ""}
          />
        </div>
        <div className="ui-field">
          <label className="ui-label" htmlFor="price">
            {messages.dashboard.fields.price}
          </label>
          <PriceInput
            id="price"
            name="price"
            className="ui-input"
            defaultValue={state?.values?.price ?? ""}
            autoFocus={err === "invalid-price"}
            error={err === "invalid-price"}
          />
        </div>
        <button type="submit" className="ui-button">
          {messages.dashboard.submitLabel}
        </button>
      </form>
    </>
  );
}
