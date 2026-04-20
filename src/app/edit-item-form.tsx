"use client";

import { useActionState } from "react";
import { PriceInput } from "@/shared/ui/price-input";
import { getTranslations } from "@/modules/i18n";
import { updateItemAction, type ItemFormState } from "./item-actions";

const messages = getTranslations("app");

type EditItemFormProps = {
  item: {
    id: string;
    title: string;
    url: string | null;
    note: string | null;
    priceFormatted: string;
  };
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

export function EditItemForm({ item }: EditItemFormProps) {
  const [state, action] = useActionState<ItemFormState, FormData>(updateItemAction, null);

  const v = state?.values;
  const err = state?.error;

  return (
    <>
      {err ? (
        <p className="ui-message ui-message-error">{getErrorMessage(err)}</p>
      ) : null}
      <form key={state?.key ?? 0} action={action} className="ui-form" style={{ maxWidth: "none" }}>
        <input type="hidden" name="itemId" value={item.id} />
        <div className="ui-field">
          <label className="ui-label" htmlFor={`title-${item.id}`}>
            {messages.dashboard.fields.title}
          </label>
          <input
            id={`title-${item.id}`}
            name="title"
            defaultValue={v?.title ?? item.title}
            className="ui-input"
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
            className="ui-input"
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
          />
        </div>
        <button type="submit" className="ui-button">
          {messages.dashboard.updateLabel}
        </button>
      </form>
    </>
  );
}
