"use client";

import { useEffect, useRef, useState } from "react";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ReplaceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export type LightboxLabels = {
  viewTitle: string;
  changeLabel: string;
  deleteLabel: string;
  errorDeleteFailed: string;
};

/**
 * Wraps an item card image with a click-to-open lightbox.
 * On the dashboard pass onReplace / onDelete + labels for management buttons.
 * On the share page render without those props for view-only mode.
 */
export function ItemImageViewer({
  src,
  onReplace,
  onDelete,
  labels,
}: {
  src: string;
  onReplace?: () => void;
  onDelete?: () => Promise<string | null>;
  labels?: LightboxLabels;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="item-card-image-section">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="item-card-image"
          onClick={() => setOpen(true)}
        />
      </div>
      {open ? (
        <ItemImageLightbox
          src={src}
          onClose={() => setOpen(false)}
          onReplace={
            onReplace
              ? () => {
                  setOpen(false);
                  onReplace();
                }
              : undefined
          }
          onDelete={onDelete}
          labels={labels}
        />
      ) : null}
    </>
  );
}

/** Full-screen image viewer dialog with optional Replace / Delete actions. */
function ItemImageLightbox({
  src,
  onClose,
  onReplace,
  onDelete,
  labels,
}: {
  src: string;
  onClose: () => void;
  onReplace?: () => void;
  onDelete?: () => Promise<string | null>;
  labels?: LightboxLabels;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    // Focus the dialog itself so no child button gets a focus ring on open.
    dialog.focus();
  }, []);

  async function handleDelete() {
    if (!onDelete) return;
    setError(null);
    setDeleting(true);
    const errorMsg = await onDelete();
    setDeleting(false);
    if (errorMsg) {
      setError(errorMsg);
    } else {
      onClose();
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (deleting) return;
    if (e.target === e.currentTarget) onClose();
  }

  const hasActions = Boolean(onReplace || onDelete);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog image-lightbox-dialog"
      tabIndex={-1}
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div className="confirm-dialog-inner image-lightbox-inner">
        <div className="image-picker-header">
          <h2 className="confirm-dialog-title">{labels?.viewTitle ?? ""}</h2>
          <button
            type="button"
            className="image-lightbox-close"
            onClick={onClose}
            disabled={deleting}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="image-lightbox-img-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="image-lightbox-img" />
        </div>

        {error ? (
          <p className="ui-note ui-note-error" style={{ textAlign: "center" }}>{error}</p>
        ) : null}

        {hasActions ? (
          <div className="image-lightbox-actions">
            {onReplace ? (
              <button
                type="button"
                className="ui-button ui-button-soft"
                onClick={onReplace}
                disabled={deleting}
              >
                <ReplaceIcon />
                {labels?.changeLabel}
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                className="ui-button ui-button-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <span className="image-picker-spinner image-lightbox-spinner" aria-hidden="true" />
                ) : (
                  <DeleteIcon />
                )}
                {labels?.deleteLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
