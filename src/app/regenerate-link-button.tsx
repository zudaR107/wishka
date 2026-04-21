"use client";

import { useRef } from "react";

type RegenerateLinkButtonLabels = {
  regenerateLabel: string;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
  cancelLabel: string;
};

type RegenerateLinkButtonProps = {
  regenerateAction: () => Promise<void>;
  labels: RegenerateLinkButtonLabels;
};

export function RegenerateLinkButton({ regenerateAction, labels }: RegenerateLinkButtonProps) {
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
        className="ui-button ui-button-soft"
        onClick={() => dialogRef.current?.showModal()}
      >
        {labels.regenerateLabel}
      </button>

      <dialog ref={dialogRef} className="confirm-dialog" onClick={handleBackdropClick}>
        <div className="confirm-dialog-inner">
          <h2 className="confirm-dialog-title">{labels.confirmTitle}</h2>
          <p className="confirm-dialog-description">{labels.confirmDescription}</p>
          <div className="confirm-dialog-actions">
            <form action={regenerateAction}>
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
