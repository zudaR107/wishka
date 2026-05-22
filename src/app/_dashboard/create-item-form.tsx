"use client";

import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PriceInput } from "@/shared/ui/price-input";
import { CurrencySelect } from "@/shared/ui/currency-select";
import { useTranslations } from "@/modules/i18n";
import { type CurrencyCode } from "@/shared/lib/currency";
import { createItemAction, type ItemFormState } from "./item-actions";
import { StarIcon } from "./star-item-button";
import { FillFromUrlButton } from "./fill-from-url-button";
import {
  ItemImagePickerDialog,
  compressImage,
  MAX_RAW_BYTES,
} from "./item-image-upload";

type CreateItemFormProps = {
  wishlistId: string;
  defaultCurrency?: CurrencyCode;
  onSuccess?: () => void;
};

export function CreateItemForm({ wishlistId, defaultCurrency = "RUB", onSuccess }: CreateItemFormProps) {
  const messages = useTranslations("app");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, action] = useActionState<ItemFormState, FormData>(createItemAction, null);
  const [starred, setStarred] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const err = state?.status === "error" ? state.error : undefined;
  const titleRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const priceWrapperRef = useRef<HTMLDivElement>(null);
  // Auto-fill state: price is re-mounted with new defaultValue via fillKey.
  const [fillKey, setFillKey] = useState(0);
  const [fillPrice, setFillPrice] = useState<string>("");
  // Image state (set by auto-fill or manual picker).
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Capture the imageUrl returned by the upload before the picker closes.
  const pendingImageUrlRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (state?.status === "success") {
      setStarred(false);
      setCurrency(defaultCurrency);
      setFillPrice("");
      setImageUrl(null);
      onSuccess?.();
      startTransition(() => router.refresh());
    }
    if (state?.status === "error") {
      if (err === "invalid-title") titleRef.current?.focus();
      else if (err === "invalid-url") urlRef.current?.focus();
      else if (err === "invalid-price") priceWrapperRef.current?.querySelector("input")?.focus();
    }
  }, [state]);

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
      setImageUrl(data.imageUrl);
    }
  }

  /** Upload a file to the temp endpoint; return error message or null on success. */
  const uploadTempImage = useCallback(async (file: File): Promise<string | null> => {
    if (file.size > MAX_RAW_BYTES) {
      return messages.dashboard.image.errorTooLarge;
    }

    let compressed: File;
    try {
      compressed = await compressImage(file);
    } catch {
      compressed = file;
    }

    const formData = new FormData();
    formData.append("image", compressed);

    try {
      const res = await fetch("/api/upload-temp-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        if (data.error === "too-large") return messages.dashboard.image.errorTooLarge;
        if (data.error === "invalid-type") return messages.dashboard.image.errorInvalidType;
        return messages.dashboard.image.errorUploadFailed;
      }

      const data = (await res.json()) as { imageUrl?: string };
      if (!data.imageUrl) return messages.dashboard.image.errorUploadFailed;

      // Store temporarily — applied in handlePickerClose after dialog animates out.
      pendingImageUrlRef.current = data.imageUrl;
      return null;
    } catch {
      return messages.dashboard.image.errorUploadFailed;
    }
  }, [messages]);

  function handlePickerClose() {
    setPickerOpen(false);
    if (pendingImageUrlRef.current) {
      setImageUrl(pendingImageUrlRef.current);
      pendingImageUrlRef.current = null;
    }
  }

  const pickerTitle = imageUrl
    ? messages.dashboard.image.pickerChangeTitle
    : messages.dashboard.image.pickerTitle;

  return (
    // Wrap form + dialog in a fragment so the dialog is NOT inside <form>.
    // A <dialog> inside <form action={serverAction}> causes button clicks in
    // the dialog to bubble up through the form and break the Server Action.
    <>
      <form
        key={state?.key ?? 0}
        action={action}
        className="ui-form"
        style={{ maxWidth: "none" }}
        id="wishlist-create-form"
        data-testid="wishlist-create-form"
        noValidate
      >
        <input type="hidden" name="wishlistId" value={wishlistId} />
        {/* Hidden: carries the image path to createItemAction on submit. */}
        <input type="hidden" name="autofillImageUrl" value={imageUrl ?? ""} />

        {/* Image preview — shown at top when an image is set (autofill or manual upload). */}
        {imageUrl ? (
          <div className="autofill-image-preview">
            <img src={imageUrl} alt="" className="autofill-image-preview-img" />
          </div>
        ) : null}

        <div className="ui-field">
          <label className="ui-label" htmlFor="title">
            {messages.dashboard.fields.title}
          </label>
          <input
            ref={titleRef}
            id="title"
            name="title"
            className={err === "invalid-title" ? "ui-input ui-input-error" : "ui-input"}
            maxLength={255}
            defaultValue={state?.values?.title ?? ""}
          />
          {err === "invalid-title" ? (
            <p className="ui-note ui-note-error">{getErrorMessage("invalid-title")}</p>
          ) : null}
        </div>
        <div className="ui-field">
          <label className="ui-label" htmlFor="url">
            {messages.dashboard.fields.url}
          </label>
          <input
            ref={urlRef}
            id="url"
            name="url"
            type="text"
            className={err === "invalid-url" ? "ui-input ui-input-error" : "ui-input"}
            maxLength={2048}
            defaultValue={state?.values?.url ?? ""}
          />
          {err === "invalid-url" ? (
            <p className="ui-note ui-note-error">{getErrorMessage("invalid-url")}</p>
          ) : (
            <p className="ui-note">{messages.dashboard.hints.url}</p>
          )}
          <FillFromUrlButton
            getUrl={() => urlRef.current?.value ?? ""}
            onResult={handleFillResult}
            labels={messages.dashboard.fillFromUrl}
          />
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
          <div
            ref={priceWrapperRef}
            style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}
          >
            <PriceInput
              key={fillKey}
              id="price"
              name="price"
              className="ui-input"
              defaultValue={state?.values?.price ?? fillPrice}
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

        {/* Submit row — matches the edit form layout. */}
        <input type="hidden" name="starred" value={starred ? "true" : "false"} />
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <button type="submit" className="ui-button">
            {messages.dashboard.submitLabel}
          </button>
          <button
            type="button"
            className={`item-star-btn${starred ? " item-star-btn--starred" : ""}`}
            aria-label={starred ? messages.dashboard.unstarLabel : messages.dashboard.starLabel}
            aria-pressed={starred}
            onClick={() => setStarred((v) => !v)}
          >
            <StarIcon filled={starred} />
          </button>
        </div>

        {/* Image action buttons — below submit, matching the edit form. */}
        <div className="item-image-upload" data-testid="item-image-upload-create">
          <div className="item-image-actions">
            <button
              type="button"
              className="ui-button ui-button-soft item-image-btn"
              onClick={() => setPickerOpen(true)}
              data-testid="item-image-upload-btn"
            >
              <span className="item-image-btn-icons">
                <PhotoIcon />
                {imageUrl ? <ReplaceIcon /> : null}
              </span>
              <span className="item-image-btn-label">
                {imageUrl
                  ? messages.dashboard.image.changeLabel
                  : messages.dashboard.image.uploadLabel}
              </span>
            </button>
            {imageUrl ? (
              <button
                type="button"
                className="ui-button ui-button-danger item-image-btn"
                onClick={() => setImageUrl(null)}
              >
                <span className="item-image-btn-icons">
                  <PhotoIcon />
                  <DeleteIcon />
                </span>
                <span className="item-image-btn-label">
                  {messages.dashboard.image.deleteLabel}
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {/* Dialog rendered outside <form> to avoid Server Action interference. */}
      {pickerOpen ? (
        <ItemImagePickerDialog
          title={pickerTitle}
          labels={messages.dashboard.image}
          onUpload={uploadTempImage}
          onClose={handlePickerClose}
        />
      ) : null}
    </>
  );
}

function PhotoIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function ReplaceIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
