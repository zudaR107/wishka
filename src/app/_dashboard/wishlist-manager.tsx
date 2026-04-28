"use client";

import { useState, useEffect, useRef } from "react";
import { getTranslations } from "@/modules/i18n";
import { WishlistSelector } from "./wishlist-selector";
import { StarButton } from "./star-item-button";
import { CreateItemForm } from "./create-item-form";
import { EditItemForm } from "./edit-item-form";
import { DeleteItemButton } from "./delete-item-button";
import { ReserveItemButton } from "./reserve-item-button";
import { CancelItemReservationButton } from "./cancel-item-reservation-button";
import { ItemEditSection } from "./item-edit-section";
import { CopyUrlButton } from "./copy-url-button";
import { RegenerateLinkButton } from "./regenerate-link-button";
import { OpenFormButton, AddItemFormFocus } from "./open-form-button";
import { formatPrice } from "../format-price";
import type {
  DeleteItemState,
  ReserveItemState,
  CancelItemReservationState,
  RegenerateState,
} from "./item-actions";
import type { OwnerWishlistItem } from "@/modules/reservation";

const common = getTranslations("common");
const messages = getTranslations("app");

export type DashboardWishlist = {
  id: string;
  name: string;
  shareUrl: string | null;
  items: OwnerWishlistItem[];
};

type WishlistManagerProps = {
  wishlists: DashboardWishlist[];
  deleteItemAction: (prev: DeleteItemState, formData: FormData) => Promise<DeleteItemState>;
  reserveItemAction: (prev: ReserveItemState, formData: FormData) => Promise<ReserveItemState>;
  cancelItemReservationAction: (
    prev: CancelItemReservationState,
    formData: FormData,
  ) => Promise<CancelItemReservationState>;
  regenerateShareLinkAction: (
    prev: RegenerateState,
    formData: FormData,
  ) => Promise<RegenerateState>;
};

export function WishlistManager({
  wishlists,
  deleteItemAction,
  reserveItemAction,
  cancelItemReservationAction,
  regenerateShareLinkAction,
}: WishlistManagerProps) {
  const [selectedId, setSelectedId] = useState(wishlists[0]?.id ?? "");

  // After router.refresh(): if the selected wishlist was deleted, fall back to first.
  useEffect(() => {
    if (wishlists.length > 0 && !wishlists.find((w) => w.id === selectedId)) {
      setSelectedId(wishlists[0].id);
    }
  }, [wishlists]);

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
  // Dependency on `wishlist` (object reference) — changes only when RSC sends new props.
  // Does NOT run after optimistic delete (no router.refresh() there → same wishlist ref).
  useEffect(() => {
    if (!wishlist) return;
    setLocalItems(wishlist.items);
    // pendingScrollToNewRef stays set; useEffect([localItems]) will scroll after DOM update.
  }, [wishlist]);

  // Scroll to new item AFTER React has committed updated localItems to the DOM.
  // Finds the newly added item by diffing against knownItemIdsRef, so it works
  // whether the item landed at the top (starred) or at the bottom (unstarred).
  useEffect(() => {
    if (!pendingScrollToNewRef.current) {
      knownItemIdsRef.current = new Set(localItems.map((i) => i.id));
      return;
    }
    pendingScrollToNewRef.current = false;
    const newItem = localItems.find((i) => !knownItemIdsRef.current.has(i.id));
    knownItemIdsRef.current = new Set(localItems.map((i) => i.id));
    const target = newItem
      ? document.querySelector<HTMLElement>(`[data-item-id="${newItem.id}"]`)
      : listEndRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          onSelect={setSelectedId}
          onCreated={setSelectedId}
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
              <li key={item.id} data-item-id={item.id} className="item-card">
                {/* Status strip */}
                {item.reservation.status === "reserved" ? (
                  <div
                    className={`item-card-status ${item.reservation.isOwn ? "item-card-status-self-reserved" : "item-card-status-reserved"}`}
                  >
                    <span className="item-card-status-dot" />
                    {item.reservation.isOwn
                      ? messages.dashboard.itemReservation.selfReservedLabel
                      : messages.dashboard.itemReservation.reservedLabel}
                  </div>
                ) : (
                  <div className="item-card-status item-card-status-available">
                    <span className="item-card-status-dot" />
                    {messages.dashboard.itemReservation.availableLabel}
                  </div>
                )}

                {/* Card view */}
                <div className="item-card-view">
                  <div className="item-card-top">
                    <div className="item-card-top-left">
                      <h3 className="item-card-title">{item.title}</h3>
                      {item.price || item.url || item.note ? (
                        <div className="item-card-meta">
                          {item.price ? (
                            <span className="item-card-price">{formatPrice(item.price)}</span>
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
                </div>

                {/* Footer: edit toggle + reserve + delete */}
                <ItemEditSection
                  editLabel={messages.dashboard.editToggleLabel}
                  reserveButton={
                    item.reservation.status === "available" ? (
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
                    ) : undefined
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
                      updatedAt: item.updatedAt.toISOString(),
                    }}
                    wishlistId={wishlist.id}
                  />
                </ItemEditSection>
              </li>
            ))}
          </ul>
          <div ref={listEndRef} aria-hidden="true" />
        </section>
      )}
    </>
  );
}

