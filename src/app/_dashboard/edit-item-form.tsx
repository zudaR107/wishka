"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PriceInput } from "@/shared/ui/price-input";
import { CurrencySelect } from "@/shared/ui/currency-select";
import { useTranslations } from "@/modules/i18n";
import { type CurrencyCode } from "@/shared/lib/currency";
import { updateItemAction, type ItemFormState } from "./item-actions";
import { useItemEditClose } from "./item-edit-section";
import { scrollAndHighlight } from "./scroll-utils";
import { ItemImageUpload } from "./item-image-upload";
import { FillFromUrlButton } from "./fill-from-url-button";

type EditItemFormProps = {
  item: {
    id: string;
    title: string;
    url: string | null;
    note: string | null;
    priceFormatted: string;
    currency: CurrencyCode;
    imageUrl: string | null;
    updatedAt: string;
  };
  wishlistId: string;
  onImageChange: (url: string | null) => void;
  onOpenPicker: () => void;
};

export function EditItemForm({ item, wishlistId, onImageChange, onOpenPicker }: EditItemFormProps) {
  const messages = useTranslations("app");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const isMountedRef = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const priceWrapperRef = useRef<HTMLDivElement>(null);
  const [state, action] = useActionState<ItemFormState, FormData>(updateItemAction, null);
  const closeEditSection = useItemEditClose();
  const [currency, setCurrency] = useState<CurrencyCode>(item.currency);
  // Auto-fill state: price is re-mounted with new defaultValue via fillKey.
  const [fillKey, setFillKey] = useState(0);
  const [fillPrice, setFillPrice] = useState<string>("");

  const v = state?.values;
  const err = state?.status === "error" ? state.error : undefined;

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

  // On success: capture card ref before collapse, close, then scroll + highlight after repaint.
  useEffect(() => {
    if (state?.status === "success") {
      const card = formRef.current?.closest(".item-card") as HTMLElement | null;
      closeEditSection();
      requestAnimationFrame(() => {
        const target = (card ?? formRef.current) as HTMLElement | null;
        if (target) scrollAndHighlight(target);
      });
      startTransition(() => router.refresh());
    }
    if (state?.status === "error") {
      if (err === "invalid-title") titleRef.current?.focus();
      else if (err === "invalid-url") urlRef.current?.focus();
      else if (err === "invalid-price") priceWrapperRef.current?.querySelector("input")?.focus();
    }
  }, [state]);

  // After router.refresh() delivers new RSC props (detected via updatedAt change),
  // reset native input values to the fresh defaults — no DOM re-mount, no flicker.
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    setCurrency(item.currency);
    setFillPrice("");
    formRef.current?.reset();
  }, [item.updatedAt]);

  function handleFillResult(data: {
    title?: string;
    price?: number;
    currency?: string;
    imageUrl?: string;
  }) {
    if (data.title && titleRef.current) {
      titleRef.current.value = data.title;
    }
    if (data.price !== undefined) {
      setFillPrice(String(Math.round(data.price)));
      setFillKey((k) => k + 1);
    }
    if (data.currency) {
      setCurrency(data.currency as CurrencyCode);
    }
    if (data.imageUrl) {
      onImageChange(data.imageUrl);
    }
  }

  return (
    <form ref={formRef} action={action} className="ui-form" style={{ maxWidth: "none" }} noValidate>
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="wishlistId" value={wishlistId} />
      <div className="ui-field">
        <label className="ui-label" htmlFor={`title-${item.id}`}>
          {messages.dashboard.fields.title}
        </label>
        <input
          ref={titleRef}
          id={`title-${item.id}`}
          name="title"
          defaultValue={v?.title ?? item.title}
          className={err === "invalid-title" ? "ui-input ui-input-error" : "ui-input"}
          maxLength={255}
        />
        {err === "invalid-title" ? (
          <p className="ui-note ui-note-error">{getErrorMessage("invalid-title")}</p>
        ) : null}
      </div>
      <div className="ui-field">
        <label className="ui-label" htmlFor={`url-${item.id}`}>
          {messages.dashboard.fields.url}
        </label>
        <input
          ref={urlRef}
          id={`url-${item.id}`}
          name="url"
          type="text"
          defaultValue={v?.url ?? item.url ?? ""}
          className={err === "invalid-url" ? "ui-input ui-input-error" : "ui-input"}
          maxLength={2048}
        />
        {err === "invalid-url" ? (
          <p className="ui-note ui-note-error">{getErrorMessage("invalid-url")}</p>
        ) : (
          <p className="ui-note">{messages.dashboard.hints.url}</p>
        )}
        <FillFromUrlButton
          getUrl={() => urlRef.current?.value ?? ""}
          itemId={item.id}
          onResult={handleFillResult}
          labels={messages.dashboard.fillFromUrl}
        />
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
        <div
          ref={priceWrapperRef}
          style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}
        >
          <PriceInput
            key={fillKey}
            id={`price-${item.id}`}
            name="price"
            defaultValue={v?.price ?? (fillKey > 0 ? fillPrice : item.priceFormatted)}
            className="ui-input"
            error={err === "invalid-price"}
            currency={currency}
          />
          <CurrencySelect
            name="currency"
            value={currency}
            onChange={setCurrency}
            label={messages.dashboard.fields.currency}
            align="right"
          />
        </div>
        {err === "invalid-price" ? (
          <p className="ui-note ui-note-error">{getErrorMessage("invalid-price")}</p>
        ) : null}
      </div>
      <button type="submit" className="ui-button">
        {messages.dashboard.updateLabel}
      </button>
      <ItemImageUpload
        itemId={item.id}
        initialImageUrl={item.imageUrl}
        onImageChange={onImageChange}
        onOpenPicker={onOpenPicker}
        labels={messages.dashboard.image}
      />
    </form>
  );
}
