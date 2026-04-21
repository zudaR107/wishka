"use client";

import { useRef } from "react";

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

type DeleteItemButtonLabels = {
  deleteLabel: string;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
  cancelLabel: string;
};

type DeleteItemButtonProps = {
  itemId: string;
  itemTitle: string;
  deleteAction: (formData: FormData) => Promise<void>;
  labels: DeleteItemButtonLabels;
};

export function DeleteItemButton({
  itemId,
  itemTitle,
  deleteAction,
  labels,
}: DeleteItemButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) {
      dialogRef.current?.close();
    }
  }

  return (
    <>
      <button
        type="button"
        className="item-delete-btn"
        onClick={() => dialogRef.current?.showModal()}
      >
        <TrashIcon />
        <span className="item-btn-label">{labels.deleteLabel}</span>
      </button>

      <dialog ref={dialogRef} className="confirm-dialog" onClick={handleBackdropClick}>
        <div className="confirm-dialog-inner">
          <h2 className="confirm-dialog-title">{labels.confirmTitle}</h2>
          <p className="confirm-dialog-description">
            {labels.confirmDescription}{" "}
            <strong className="confirm-dialog-item-name">&laquo;{itemTitle}&raquo;</strong>?
          </p>
          <div className="confirm-dialog-actions">
            <form action={deleteAction}>
              <input type="hidden" name="itemId" value={itemId} />
              <button type="submit" className="ui-button ui-button-danger">
                {labels.confirmLabel}
              </button>
            </form>
            <button
              type="button"
              className="ui-button ui-button-soft"
              onClick={() => dialogRef.current?.close()}
            >
              {labels.cancelLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
