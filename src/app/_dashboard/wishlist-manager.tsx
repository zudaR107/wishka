"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "@/modules/i18n";
import { WishlistSelector } from "./wishlist-selector";
import { StarButton } from "./star-item-button";
import { CreateItemForm } from "./create-item-form";
import { EditItemForm } from "./edit-item-form";
import { DeleteItemButton } from "./delete-item-button";
import { ReserveItemButton } from "./reserve-item-button";
import { CancelItemReservationButton } from "./cancel-item-reservation-button";
import { CancelOwnerReservationButton } from "./cancel-owner-reservation-button";
import { ItemEditSection } from "./item-edit-section";
import { CopyUrlButton } from "./copy-url-button";
import { QrCodeButton } from "./qr-code-button";
import { RegenerateLinkButton } from "./regenerate-link-button";
import { OpenFormButton, AddItemFormFocus } from "./open-form-button";
import { scrollAndHighlight } from "./scroll-utils";
import { ItemImageViewer } from "./item-image-lightbox";
import {
  ItemImagePickerDialog,
  compressImage,
  MAX_RAW_BYTES,
  type ImageLabels,
} from "./item-image-upload";
import { formatPrice } from "../format-price";
import { type CurrencyCode } from "@/shared/lib/currency";
import type {
  DeleteItemState,
  ReserveItemState,
  CancelItemReservationState,
  CancelOwnerReservationState,
  RegenerateState,
} from "./item-actions";
import type { OwnerWishlistItem } from "@/modules/reservation";

type ImportResult =
  | { status: "success"; wishlists: number; items: number }
  | { status: "error"; code: "empty" | "invalid-format" | "no-wishlists" | "unknown" };

export type DashboardWishlist = {
  id: string;
  name: string;
  shareUrl: string | null;
  items: OwnerWishlistItem[];
};

type WishlistManagerProps = {
  wishlists: DashboardWishlist[];
  initialSelectedId: string;
  defaultCurrency: CurrencyCode;
  showReservations: boolean;
  deleteItemAction: (prev: DeleteItemState, formData: FormData) => Promise<DeleteItemState>;
  reserveItemAction: (prev: ReserveItemState, formData: FormData) => Promise<ReserveItemState>;
  cancelItemReservationAction: (
    prev: CancelItemReservationState,
    formData: FormData,
  ) => Promise<CancelItemReservationState>;
  cancelOwnerReservationAction: (
    prev: CancelOwnerReservationState,
    formData: FormData,
  ) => Promise<CancelOwnerReservationState>;
  regenerateShareLinkAction: (
    prev: RegenerateState,
    formData: FormData,
  ) => Promise<RegenerateState>;
  importAction: (text: string) => Promise<ImportResult>;
};

const SELECTED_WISHLIST_COOKIE = "wshka_selected_wishlist";

export function WishlistManager({
  wishlists,
  initialSelectedId,
  defaultCurrency,
  showReservations,
  deleteItemAction,
  reserveItemAction,
  cancelItemReservationAction,
  cancelOwnerReservationAction,
  regenerateShareLinkAction,
  importAction,
}: WishlistManagerProps) {
  const common = useTranslations("common");
  const messages = useTranslations("app");
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  // Ref so the deletion-fallback effect always sees the latest selectedId
  // without adding it to the dependency array (which would cause a false
  // fallback when a newly-created wishlist hasn't arrived via RSC yet).
  const selectedIdRef = useRef(initialSelectedId);

  // After router.refresh(): if the selected wishlist was deleted, fall back to first.
  useEffect(() => {
    if (wishlists.length > 0 && !wishlists.find((w) => w.id === selectedIdRef.current)) {
      const fallbackId = wishlists[0].id;
      selectedIdRef.current = fallbackId;
      setSelectedId(fallbackId);
      document.cookie = `${SELECTED_WISHLIST_COOKIE}=${fallbackId}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [wishlists]);

  function handleSelectWishlist(id: string) {
    selectedIdRef.current = id;
    setSelectedId(id);
    document.cookie = `${SELECTED_WISHLIST_COOKIE}=${id}; path=/; max-age=31536000; SameSite=Lax`;
  }

  const wishlist = wishlists.find((w) => w.id === selectedId) ?? wishlists[0];

  // Local copy of items — lets us remove items optimistically on delete
  // without triggering a full router.refresh() that repaints the background.
  const [localItems, setLocalItems] = useState(wishlist?.items ?? []);
  // Set to true after create so the post-refresh sync scrolls to the new item.
  const pendingScrollToNewRef = useRef(false);
  const listEndRef = useRef<HTMLDivElement>(null);
  // Tracks known item IDs so we can find the newly created one after RSC refresh.
  const knownItemIdsRef = useRef<Set<string>>(new Set(wishlist?.items.map((i) => i.id) ?? []));

  // Sync local items whenever RSC delivers new wishlist data (create/edit/star/reserve).
  useEffect(() => {
    if (!wishlist) return;
    setLocalItems(wishlist.items);
  }, [wishlist]);

  // Active picker: item ID whose picker dialog is open (null = closed).
  const [activePickerItemId, setActivePickerItemId] = useState<string | null>(null);

  /** Upload a file for a given item. Returns null on success, error message on failure. */
  async function uploadImageForItem(itemId: string, file: File): Promise<string | null> {
    const img = messages.dashboard.image;
    if (file.size > MAX_RAW_BYTES) return img.errorTooLarge;
    if (!file.type.startsWith("image/")) return img.errorInvalidType;
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressed, file.name);
      const res = await fetch(`/api/items/${itemId}/image`, { method: "POST", body: formData });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (data.error === "too-large") return img.errorTooLarge;
        if (data.error === "invalid-type") return img.errorInvalidType;
        return img.errorUploadFailed;
      }
      const data = (await res.json()) as { imageUrl: string };
      setLocalItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, imageUrl: data.imageUrl } : i)));
      return null;
    } catch {
      return img.errorUploadFailed;
    }
  }

  /** Delete the image for a given item. Returns null on success, error message on failure. */
  async function deleteImageForItem(itemId: string): Promise<string | null> {
    try {
      const res = await fetch(`/api/items/${itemId}/image`, { method: "DELETE" });
      if (!res.ok) return messages.dashboard.image.errorUploadFailed;
      setLocalItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, imageUrl: null } : i)));
      return null;
    } catch {
      return messages.dashboard.image.errorUploadFailed;
    }
  }

  // Scroll to new item AFTER React has committed updated localItems to the DOM.
  useEffect(() => {
    if (!pendingScrollToNewRef.current) {
      knownItemIdsRef.current = new Set(localItems.map((i) => i.id));
      return;
    }
    pendingScrollToNewRef.current = false;
    const newItem = localItems.find((i) => !knownItemIdsRef.current.has(i.id));
    knownItemIdsRef.current = new Set(localItems.map((i) => i.id));
    if (newItem) {
      const target = document.querySelector<HTMLElement>(`[data-item-id="${newItem.id}"]`);
      if (target) scrollAndHighlight(target);
    } else {
      // Fallback: no new item identified — scroll to list end without highlight.
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [localItems]);

  if (!wishlist) {
    return null;
  }

  const formId = `wishlist-create-form-panel-${wishlist.id}`;
  const addDetailsRef = useRef<HTMLDetailsElement>(null);

  return (
    <>
      {/* Page header — includes wishlist selector */}
      <div className="dashboard-header">
        <p className="page-brand-label">{common.brand}</p>
        <WishlistSelector
          wishlists={wishlists}
          selectedId={selectedId}
          itemCount={localItems.length}
          onSelect={handleSelectWishlist}
          onCreated={handleSelectWishlist}
          importAction={importAction}
        />
      </div>

      {/* Share link panel */}
      <div className="share-panel">
        <div>
          <h2 className="share-panel-title">{messages.dashboard.share.title}</h2>
          <p className="share-panel-description">{messages.dashboard.share.description}</p>
        </div>
        <div className="share-url-row">
          <input
            id="share-link-url"
            data-testid="share-link-url"
            value={wishlist.shareUrl ?? ""}
            readOnly
            className="share-url-input"
            aria-label={messages.dashboard.share.urlLabel}
          />
          {wishlist.shareUrl ? <CopyUrlButton url={wishlist.shareUrl} /> : null}
          {wishlist.shareUrl ? (
            <QrCodeButton
              url={wishlist.shareUrl}
              labels={{
                qrLabel: messages.dashboard.share.qrLabel,
                qrDialogTitle: messages.dashboard.share.qrDialogTitle,
                qrDownloadLabel: messages.dashboard.share.qrDownloadLabel,
                qrCloseLabel: messages.dashboard.share.qrCloseLabel,
              }}
            />
          ) : null}
        </div>
        <p className="ui-note">{messages.dashboard.share.copyHint}</p>
        <div className="share-panel-actions">
          <RegenerateLinkButton
            wishlistId={wishlist.id}
            regenerateAction={regenerateShareLinkAction}
            labels={{
              regenerateLabel: messages.dashboard.share.regenerateLabel,
              confirmTitle: messages.dashboard.share.regenerateConfirmTitle,
              confirmDescription: messages.dashboard.share.regenerateConfirmDescription,
              confirmLabel: messages.dashboard.share.regenerateConfirmLabel,
              cancelLabel: messages.dashboard.share.regenerateCancelLabel,
            }}
          />
        </div>
      </div>

      {/* Add item collapsible */}
      <AddItemFormFocus formId={formId} inputName="title" />
      <details ref={addDetailsRef} className="add-item-details" id={formId}>
        <summary className="add-item-summary" data-testid="add-item-toggle">
          <span>{messages.dashboard.addItemToggleLabel}</span>
        </summary>
        <div className="add-item-form-inner">
          <p
            style={{
              fontSize: "var(--font-size-label)",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-5)",
            }}
          >
            {messages.dashboard.formDescription}
          </p>
          <CreateItemForm
            wishlistId={wishlist.id}
            defaultCurrency={defaultCurrency}
            onSuccess={() => {
              if (addDetailsRef.current) addDetailsRef.current.open = false;
              pendingScrollToNewRef.current = true;
            }}
          />
        </div>
      </details>

      {/* Items list or empty state */}
      {localItems.length === 0 ? (
        <div className="dashboard-empty" data-testid="wishlist-empty-state">
          <p className="dashboard-empty-title">{messages.dashboard.emptyTitle}</p>
          <p className="dashboard-empty-description">{messages.dashboard.emptyDescription}</p>
          <OpenFormButton formId={formId} inputName="title" className="ui-button">
            {messages.dashboard.emptyActionLabel}
          </OpenFormButton>
        </div>
      ) : (
        <section>
          <h2
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 var(--space-3)",
            }}
          >
            {messages.dashboard.itemsTitle}
          </h2>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
              overflowAnchor: "none",
            }}
          >
            {localItems.map((item) => (
              <li key={item.id} id={`item-${item.id}`} data-item-id={item.id} className="item-card">
                {/* Status strip:
                    - showReservations=false: only self-reservation shown, nothing else
                    - showReservations=true: full status (available / reserved / self-reserved) */}
                {item.reservation.status === "reserved" && item.reservation.isOwn ? (
                  <div className="item-card-status item-card-status-self-reserved">
                    <span className="item-card-status-dot" />
                    {messages.dashboard.itemReservation.selfReservedLabel}
                  </div>
                ) : showReservations && item.reservation.status === "reserved" ? (
                  <div className="item-card-status item-card-status-reserved">
                    <span className="item-card-status-dot" />
                    {messages.dashboard.itemReservation.reservedLabel}
                  </div>
                ) : showReservations ? (
                  <div className="item-card-status item-card-status-available">
                    <span className="item-card-status-dot" />
                    {messages.dashboard.itemReservation.availableLabel}
                  </div>
                ) : null}

                {/* Card view */}
                <div className="item-card-view">
                  <div className="item-card-top">
                    <div className="item-card-top-left">
                      <h3 className="item-card-title">{item.title}</h3>
                      {item.price || item.url || item.note ? (
                        <div className="item-card-meta">
                          {item.price ? (
                            <span className="item-card-price">
                              {formatPrice(item.price, item.currency as CurrencyCode)}
                            </span>
                          ) : null}
                          {item.url ? (
                            <span className="item-card-url-row">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="item-card-url"
                              >
                                {item.url}
                              </a>
                              <CopyUrlButton url={item.url} />
                            </span>
                          ) : null}
                          {item.note ? (
                            <span className="item-card-note">{item.note}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="item-card-top-right">
                      <StarButton
                        itemId={item.id}
                        wishlistId={wishlist.id}
                        starred={item.starred}
                        starLabel={messages.dashboard.starLabel}
                        unstarLabel={messages.dashboard.unstarLabel}
                      />
                    </div>
                  </div>
                  {item.imageUrl ? (
                    <ItemImageViewer
                      src={item.imageUrl}
                      onReplace={() => setActivePickerItemId(item.id)}
                      onDelete={() => deleteImageForItem(item.id)}
                      labels={{
                        viewTitle: messages.dashboard.image.viewTitle,
                        changeLabel: messages.dashboard.image.changeLabel,
                        deleteLabel: messages.dashboard.image.deleteLabel,
                        errorDeleteFailed: messages.dashboard.image.errorUploadFailed,
                      }}
                    />
                  ) : null}
                </div>

                {/* Footer: edit toggle + reserve + delete */}
                <ItemEditSection
                  editLabel={messages.dashboard.editToggleLabel}
                  reserveButton={
                    item.reservation.status === "available" || (!item.reservation.isOwn && !showReservations) ? (
                      <ReserveItemButton
                        itemId={item.id}
                        reserveLabel={messages.dashboard.reserveLabel}
                        reserveAction={reserveItemAction}
                      />
                    ) : item.reservation.isOwn ? (
                      <CancelItemReservationButton
                        reservationId={item.reservation.reservationId}
                        cancelLabel={messages.dashboard.cancelReservationLabel}
                        cancelAction={cancelItemReservationAction}
                      />
                    ) : (
                      <CancelOwnerReservationButton
                        itemId={item.id}
                        labels={{
                          buttonLabel: messages.dashboard.ownerCancelReservationLabel,
                          confirmTitle: messages.dashboard.ownerCancelReservationConfirmTitle,
                          confirmDescription: messages.dashboard.ownerCancelReservationConfirmDescription,
                          confirmLabel: messages.dashboard.ownerCancelReservationConfirmLabel,
                          cancelLabel: messages.dashboard.ownerCancelReservationCancelLabel,
                        }}
                        cancelAction={cancelOwnerReservationAction}
                      />
                    )
                  }
                  deleteButton={
                    <DeleteItemButton
                      itemId={item.id}
                      wishlistId={wishlist.id}
                      itemTitle={item.title}
                      deleteAction={deleteItemAction}
                      onSuccess={() =>
                        setLocalItems((prev) => prev.filter((i) => i.id !== item.id))
                      }
                      labels={{
                        deleteLabel: messages.dashboard.deleteLabel,
                        confirmTitle: messages.dashboard.deleteConfirmTitle,
                        confirmDescription: messages.dashboard.deleteConfirmDescription,
                        confirmLabel: messages.dashboard.deleteConfirmLabel,
                        cancelLabel: messages.dashboard.deleteCancelLabel,
                      }}
                    />
                  }
                >
                  <EditItemForm
                    item={{
                      id: item.id,
                      title: item.title,
                      url: item.url,
                      note: item.note,
                      priceFormatted: item.price ?? "",
                      currency: item.currency as CurrencyCode,
                      imageUrl: item.imageUrl,
                      updatedAt: item.updatedAt.toISOString(),
                    }}
                    wishlistId={wishlist.id}
                    onImageChange={(url) =>
                      setLocalItems((prev) =>
                        prev.map((i) => (i.id === item.id ? { ...i, imageUrl: url } : i)),
                      )
                    }
                    onOpenPicker={() => setActivePickerItemId(item.id)}
                  />
                </ItemEditSection>
              </li>
            ))}
          </ul>
          <div ref={listEndRef} aria-hidden="true" />
        </section>
      )}

      {/* Picker dialog — rendered at top level so it works even when edit section is collapsed */}
      {activePickerItemId ? (
        <ItemImagePickerDialog
          title={
            localItems.find((i) => i.id === activePickerItemId)?.imageUrl
              ? messages.dashboard.image.pickerChangeTitle
              : messages.dashboard.image.pickerTitle
          }
          labels={messages.dashboard.image as ImageLabels}
          onUpload={(file) => uploadImageForItem(activePickerItemId, file)}
          onClose={() => setActivePickerItemId(null)}
        />
      ) : null}
    </>
  );
}
