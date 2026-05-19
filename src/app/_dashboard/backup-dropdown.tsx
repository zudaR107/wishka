"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type BackupLabels = {
  exportAllLabel: string;
  exportOneLabel: string;
  importLabel: string;
  importDialogTitle: string;
  importDialogDescription: string;
  importFileLabel: string;
  importSubmitLabel: string;
  importCancelLabel: string;
  importSuccess: string;
  importErrorEmpty: string;
  importErrorInvalidFormat: string;
  importErrorNoWishlists: string;
  importErrorUnknown: string;
};

type ImportResult =
  | { status: "success"; wishlists: number; items: number }
  | { status: "error"; code: "empty" | "invalid-format" | "no-wishlists" | "unknown" };

type BackupDropdownProps = {
  /** ID of the currently selected wishlist — used for single-list export. */
  selectedWishlistId: string;
  labels: BackupLabels;
  importAction: (text: string) => Promise<ImportResult>;
  /** Label shown on the trigger button. */
  triggerLabel: string;
};

function ChevronDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function BackupIcon() {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function BackupDropdown({
  selectedWishlistId,
  labels,
  importAction,
  triggerLabel,
}: BackupDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackOk, setFeedbackOk] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Close dropdown on outside click
  function handleDropdownOutside(e: MouseEvent) {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setOpen(false);
      document.removeEventListener("mousedown", handleDropdownOutside);
    }
  }

  function toggleDropdown() {
    setOpen((v) => {
      if (!v) {
        document.addEventListener("mousedown", handleDropdownOutside);
      } else {
        document.removeEventListener("mousedown", handleDropdownOutside);
      }
      return !v;
    });
  }

  function exportOne() {
    setOpen(false);
    const url = `/api/wishlist/export?wishlistId=${encodeURIComponent(selectedWishlistId)}`;
    const a = document.createElement("a");
    a.href = url;
    a.click();
  }

  function exportAll() {
    setOpen(false);
    const a = document.createElement("a");
    a.href = "/api/wishlist/export";
    a.click();
  }

  function openImportDialog() {
    setOpen(false);
    setFeedback(null);
    setFeedbackOk(false);
    if (fileRef.current) fileRef.current.value = "";
    dialogRef.current?.showModal();
  }

  function closeImportDialog() {
    dialogRef.current?.close();
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) closeImportDialog();
  }

  function formatSuccess(wishlists: number, items: number): string {
    return labels.importSuccess
      .replace("{wishlists}", String(wishlists))
      .replace("{items}", String(items));
  }

  function errorMessage(code: "empty" | "invalid-format" | "no-wishlists" | "unknown"): string {
    switch (code) {
      case "empty": return labels.importErrorEmpty;
      case "invalid-format": return labels.importErrorInvalidFormat;
      case "no-wishlists": return labels.importErrorNoWishlists;
      default: return labels.importErrorUnknown;
    }
  }

  async function handleImportSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const text = await file.text();
    startTransition(async () => {
      const result = await importAction(text);
      if (result.status === "success") {
        setFeedback(formatSuccess(result.wishlists, result.items));
        setFeedbackOk(true);
        router.refresh();
      } else {
        setFeedback(errorMessage(result.code));
        setFeedbackOk(false);
      }
    });
  }

  return (
    <>
      {/* Trigger + dropdown */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          type="button"
          className="ui-button ui-button-soft"
          onClick={toggleDropdown}
          aria-expanded={open}
          aria-haspopup="menu"
          data-testid="backup-dropdown-trigger"
        >
          <BackupIcon />
          <span className="wishlist-btn-label">{triggerLabel}</span>
          <ChevronDownIcon />
        </button>

        {open && (
          <ul
            role="menu"
            className="backup-dropdown-menu"
            data-testid="backup-dropdown-menu"
          >
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="backup-dropdown-item"
                onClick={exportOne}
                data-testid="export-wishlist-btn"
              >
                {labels.exportOneLabel}
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="backup-dropdown-item"
                onClick={exportAll}
                data-testid="export-all-btn"
              >
                {labels.exportAllLabel}
              </button>
            </li>
            <li role="none" className="backup-dropdown-separator" aria-hidden="true" />
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="backup-dropdown-item"
                onClick={openImportDialog}
                data-testid="import-wishlist-btn"
              >
                {labels.importLabel}
              </button>
            </li>
          </ul>
        )}
      </div>

      {/* Import dialog */}
      <dialog
        ref={dialogRef}
        className="qr-dialog"
        onClick={handleBackdropClick}
        data-testid="import-wishlist-dialog"
      >
        <div className="qr-dialog-inner">
          <h2 className="qr-dialog-title">{labels.importDialogTitle}</h2>
          <p
            style={{
              fontSize: "var(--font-size-label)",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-5)",
            }}
          >
            {labels.importDialogDescription}
          </p>

          <form onSubmit={handleImportSubmit}>
            <div style={{ marginBottom: "var(--space-5)" }}>
              <label
                htmlFor="import-file-input"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-label)",
                  marginBottom: "var(--space-2)",
                }}
              >
                {labels.importFileLabel}
              </label>
              <input
                id="import-file-input"
                ref={fileRef}
                type="file"
                accept=".md,text/markdown,text/plain"
                required
                data-testid="import-file-input"
                style={{ display: "block", width: "100%" }}
              />
            </div>

            {feedback ? (
              <p
                data-testid="import-feedback"
                style={{
                  fontSize: "var(--font-size-label)",
                  color: feedbackOk ? "var(--color-success, green)" : "var(--color-error)",
                  marginBottom: "var(--space-4)",
                }}
              >
                {feedback}
              </p>
            ) : null}

            <div className="qr-dialog-actions">
              <button
                type="submit"
                className="ui-button"
                disabled={isPending}
                data-testid="import-submit-btn"
              >
                {labels.importSubmitLabel}
              </button>
              <button
                type="button"
                className="ui-button ui-button-soft"
                onClick={closeImportDialog}
                data-testid="import-cancel-btn"
              >
                {labels.importCancelLabel}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
