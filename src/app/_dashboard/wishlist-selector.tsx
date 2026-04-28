"use client";

import { useState, useRef, useEffect } from "react";
import { getTranslations } from "@/modules/i18n";
import { CreateWishlistForm } from "./create-wishlist-form";
import { RenameWishlistForm } from "./rename-wishlist-form";
import { DeleteWishlistButton } from "./delete-wishlist-button";

const messages = getTranslations("app");

function PlusIcon() {
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
      style={{ flexShrink: 0 }}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function PencilIcon() {
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
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

type WishlistSelectorEntry = {
  id: string;
  name: string;
};

type WishlistSelectorProps = {
  wishlists: WishlistSelectorEntry[];
  selectedId: string;
  itemCount: number;
  onSelect: (id: string) => void;
  onCreated: (id: string) => void;
};

export function WishlistSelector({
  wishlists,
  selectedId,
  itemCount,
  onSelect,
  onCreated,
}: WishlistSelectorProps) {
  const [mode, setMode] = useState<"idle" | "renaming" | "creating">("idle");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedWishlist = wishlists.find((w) => w.id === selectedId) ?? wishlists[0];

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [dropdownOpen]);

  function handleCreated(id: string) {
    onCreated(id);
    setMode("idle");
  }

  const pluralForms = messages.dashboard.itemCountForms;
  const countLabel = `${itemCount} ${pluralize(itemCount, pluralForms)}`;

  // ── Title row (always visible) ───────────────────────────────────────────
  const titleRow = (
    <div className="dashboard-title-row">
      <div ref={dropdownRef} className="wishlist-dropdown" data-testid="wishlist-selector">
        <button
          type="button"
          className="wishlist-dropdown-trigger"
          onClick={() => setDropdownOpen((v) => !v)}
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          data-testid="wishlist-select"
        >
          <h1 className="dashboard-title">{selectedWishlist?.name}</h1>
          <ChevronDownIcon />
        </button>

        {dropdownOpen && (
          <ul className="wishlist-dropdown-menu" role="listbox">
            {wishlists.map((w) => (
              <li key={w.id} role="option" aria-selected={w.id === selectedId}>
                <button
                  type="button"
                  className={`wishlist-dropdown-item${w.id === selectedId ? " wishlist-dropdown-item--selected" : ""}`}
                  onClick={() => {
                    onSelect(w.id);
                    setDropdownOpen(false);
                  }}
                >
                  {w.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <span className="dashboard-count" data-testid="wishlist-item-count">
        {countLabel}
      </span>
    </div>
  );

  // ── Action / edit row ────────────────────────────────────────────────────
  const actionsRow =
    mode === "creating" ? (
      <CreateWishlistForm onCreated={handleCreated} onCancel={() => setMode("idle")} />
    ) : mode === "renaming" && selectedWishlist ? (
      <RenameWishlistForm
        wishlistId={selectedWishlist.id}
        currentName={selectedWishlist.name}
        onCancel={() => setMode("idle")}
      />
    ) : (
      <div className="wishlist-actions-row">
        <button
          type="button"
          className="ui-button ui-button-soft"
          onClick={() => setMode("renaming")}
          data-testid="rename-wishlist-btn"
          title={messages.dashboard.wishlists.renameLabel}
        >
          <PencilIcon />
          <span className="wishlist-btn-label">{messages.dashboard.wishlists.renameLabel}</span>
        </button>

        <button
          type="button"
          className="ui-button ui-button-soft"
          onClick={() => setMode("creating")}
          data-testid="create-wishlist-btn"
          title={messages.dashboard.wishlists.createLabel}
        >
          <PlusIcon />
          <span className="wishlist-btn-label">{messages.dashboard.wishlists.createLabel}</span>
        </button>

        <DeleteWishlistButton wishlistId={selectedId} disabled={wishlists.length <= 1} />
      </div>
    );

  return (
    <>
      {titleRow}
      {actionsRow}
    </>
  );
}

function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
