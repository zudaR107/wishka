"use client";

import { useRef, useState, useEffect, useCallback } from "react";

function PhotoIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
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

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/** Max raw size we accept before client-side compression (8 MB, mirrors server limit). */
export const MAX_RAW_BYTES = 8 * 1024 * 1024;
/** Target max size after compression (1 MB). */
const TARGET_BYTES = 1 * 1024 * 1024;
/** Max dimension (px) for the longer side after downscaling. */
const MAX_DIM = 1920;
/** JPEG quality used for the compressed output. */
const JPEG_QUALITY = 0.85;

export type ImageLabels = {
  uploadLabel: string;
  changeLabel: string;
  deleteLabel: string;
  errorTooLarge: string;
  errorInvalidType: string;
  errorUploadFailed: string;
  pickerTitle: string;
  pickerChangeTitle: string;
  pickerDropHint: string;
  pickerPasteHint: string;
  pickerChooseFile: string;
  pickerHint: string;
  pickerDragActive: string;
};

type ItemImageUploadProps = {
  itemId: string;
  initialImageUrl: string | null;
  /** Called with the new URL after upload, or null after deletion. */
  onImageChange: (url: string | null) => void;
  /** Called when the user requests to open the picker (managed by the parent). */
  onOpenPicker: () => void;
  labels: ImageLabels;
};

/**
 * Standalone image upload widget embedded in the edit section.
 * Clicking "Add / Replace" opens a picker dialog with drag-and-drop,
 * clipboard paste support, and an in-dialog upload preview.
 */
export function ItemImageUpload({
  itemId,
  initialImageUrl,
  onImageChange,
  onOpenPicker,
  labels,
}: ItemImageUploadProps) {
  const [hasImage, setHasImage] = useState(initialImageUrl !== null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sync hasImage when the parent updates initialImageUrl after an external upload
  // (e.g. upload triggered from the lightbox or any other external entry point).
  useEffect(() => {
    setHasImage(initialImageUrl !== null);
  }, [initialImageUrl]);

  async function handleDelete() {
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/items/${itemId}/image`, { method: "DELETE" });
      if (!res.ok) {
        setDeleteError(labels.errorUploadFailed);
        return;
      }
      setHasImage(false);
      onImageChange(null);
    } catch {
      setDeleteError(labels.errorUploadFailed);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="item-image-upload" data-testid="item-image-upload">
      <div className="item-image-actions">
        <button
          type="button"
          className="ui-button ui-button-soft item-image-btn"
          onClick={onOpenPicker}
          disabled={deleting}
          data-testid="item-image-upload-btn"
        >
          <span className="item-image-btn-icons">
            <PhotoIcon />
            {hasImage && !deleting ? <ReplaceIcon /> : null}
          </span>
          <span className="item-image-btn-label">
            {hasImage ? labels.changeLabel : labels.uploadLabel}
          </span>
        </button>
        {hasImage ? (
          <button
            type="button"
            className="ui-button ui-button-danger item-image-btn"
            onClick={handleDelete}
            disabled={deleting}
          >
            <span className="item-image-btn-icons">
              <PhotoIcon />
              <DeleteIcon />
            </span>
            <span className="item-image-btn-label">{labels.deleteLabel}</span>
          </button>
        ) : null}
      </div>

      {deleteError ? <p className="ui-note ui-note-error">{deleteError}</p> : null}
    </div>
  );
}

/** Dialog with drag-and-drop, clipboard paste, file picker, and upload preview. */
export function ItemImagePickerDialog({
  title,
  labels,
  onUpload,
  onClose,
}: {
  title: string;
  labels: ImageLabels;
  onUpload: (file: File) => Promise<string | null>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // Revoke object URL when it changes or on unmount to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clear success timer on unmount.
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (uploading || success) return;
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
      setUploading(true);

      const errorMsg = await onUpload(file);

      setUploading(false);
      if (errorMsg) {
        setPreviewUrl(null); // cleanup effect revokes the old URL
        setError(errorMsg);
      } else {
        // Show success state briefly, then auto-close.
        setSuccess(true);
        successTimerRef.current = setTimeout(onClose, 1200);
      }
    },
    [onUpload, onClose, uploading, success],
  );

  // Clipboard paste — scoped to dialog being mounted
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (!imageItem) return;
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        handleFile(file);
      }
    }
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handleFile]);

  const busy = uploading || success;

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (busy) return;
    if (e.target === e.currentTarget) onClose();
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!busy) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (busy) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog image-picker-dialog"
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div className="confirm-dialog-inner">
        <div className="image-picker-header">
          <h2 className="confirm-dialog-title">{title}</h2>
          <button
            type="button"
            className="image-picker-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        <div
          className={`image-picker-drop-zone${isDragging ? " image-picker-drop-zone-active" : ""}${previewUrl ? " image-picker-drop-zone-preview" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="" className="image-picker-preview" />
              {uploading ? (
                <div className="image-picker-uploading-overlay">
                  <span className="image-picker-spinner" aria-hidden="true" />
                </div>
              ) : null}
              {success ? (
                <div className="image-picker-success-overlay">
                  <span className="image-picker-check">
                    <CheckIcon />
                  </span>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <PhotoIcon size={32} />
              <p className="image-picker-drop-hint">
                {isDragging ? labels.pickerDragActive : labels.pickerDropHint}
              </p>
              <p className="image-picker-paste-hint">{labels.pickerPasteHint}</p>
            </>
          )}
        </div>

        {error ? (
          <p className="ui-note ui-note-error" style={{ textAlign: "center" }}>{error}</p>
        ) : null}

        <button
          type="button"
          className="ui-button ui-button-secondary ui-button-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          {labels.pickerChooseFile}
        </button>

        <p className="ui-note" style={{ textAlign: "center" }}>{labels.pickerHint}</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </dialog>
  );
}

/**
 * Compress an image using the Canvas API.
 * Exported for use by parent components that manage the picker at a higher level.
 * Downscales to MAX_DIM on the longer side and encodes as JPEG at JPEG_QUALITY.
 * If the result is larger than TARGET_BYTES, retries at lower quality.
 */
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let w = img.naturalWidth;
      let h = img.naturalHeight;

      if (w > MAX_DIM || h > MAX_DIM) {
        if (w >= h) {
          h = Math.round((h * MAX_DIM) / w);
          w = MAX_DIM;
        } else {
          w = Math.round((w * MAX_DIM) / h);
          h = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          if (blob.size > TARGET_BYTES) {
            canvas.toBlob(
              (blob2) => {
                resolve(new File([blob2 ?? blob], file.name, { type: "image/jpeg" }));
              },
              "image/jpeg",
              0.7,
            );
          } else {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          }
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}
