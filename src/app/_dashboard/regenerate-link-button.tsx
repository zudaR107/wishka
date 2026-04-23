"use client";

import { useRef, useEffect, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getTranslations } from "@/modules/i18n";
import type { RegenerateState } from "./item-actions";

const messages = getTranslations("app");

type RegenerateLinkButtonLabels = {
  regenerateLabel: string;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
  cancelLabel: string;
};

type RegenerateLinkButtonProps = {
  regenerateAction: (prev: RegenerateState) => Promise<RegenerateState>;
  labels: RegenerateLinkButtonLabels;
};

export function RegenerateLinkButton({ regenerateAction, labels }: RegenerateLinkButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(regenerateAction, null);

  useEffect(() => {
    if (state?.status === "success") {
      dialogRef.current?.close();
      startTransition(() => router.refresh());
    }
  }, [state]);

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
          {state?.status === "error" ? (
            <p className="ui-message ui-message-error">
              {messages.dashboard.share.errors.unknownRegenerate}
            </p>
          ) : null}
          <div className="confirm-dialog-actions">
            <form action={formAction}>
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
