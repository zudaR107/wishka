"use client";

import { useRef, useState } from "react";

function PhotoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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

/** Max raw size we accept before client-side compression (8 MB, mirrors server limit). */
const MAX_RAW_BYTES = 8 * 1024 * 1024;
/** Target max size after compression (1 MB). */
const TARGET_BYTES = 1 * 1024 * 1024;
/** Max dimension (px) for the longer side after downscaling. */
const MAX_DIM = 1920;
/** JPEG quality used for the compressed output. */
const JPEG_QUALITY = 0.85;

type ItemImageUploadProps = {
  itemId: string;
  initialImageUrl: string | null;
  /** Called with the new URL after upload, or null after deletion. */
  onImageChange: (url: string | null) => void;
  labels: {
    uploadLabel: string;
    changeLabel: string;
    deleteLabel: string;
    uploading: string;
    errorTooLarge: string;
    errorInvalidType: string;
    errorUploadFailed: string;
  };
};

/**
 * Standalone image upload widget embedded in the edit section.
 * Does NOT show an image preview — the card above already shows it.
 * Makes its own fetch() calls and reports changes via onImageChange.
 */
export function ItemImageUpload({
  itemId,
  initialImageUrl,
  onImageChange,
  labels,
}: ItemImageUploadProps) {
  const [hasImage, setHasImage] = useState(initialImageUrl !== null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!inputRef.current) return;
    inputRef.current.value = "";

    if (!file) return;

    if (file.size > MAX_RAW_BYTES) {
      setError(labels.errorTooLarge);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(labels.errorInvalidType);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressed, file.name);

      const res = await fetch(`/api/items/${itemId}/image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (data.error === "too-large") {
          setError(labels.errorTooLarge);
        } else if (data.error === "invalid-type") {
          setError(labels.errorInvalidType);
        } else {
          setError(labels.errorUploadFailed);
        }
        return;
      }

      const data = (await res.json()) as { imageUrl: string };
      setHasImage(true);
      onImageChange(data.imageUrl);
    } catch {
      setError(labels.errorUploadFailed);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setUploading(true);
    try {
      const res = await fetch(`/api/items/${itemId}/image`, { method: "DELETE" });
      if (!res.ok) {
        setError(labels.errorUploadFailed);
        return;
      }
      setHasImage(false);
      onImageChange(null);
    } catch {
      setError(labels.errorUploadFailed);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="item-image-upload" data-testid="item-image-upload">
      <div className="item-image-actions">
        <button
          type="button"
          className="ui-button ui-button-soft item-image-btn"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          data-testid="item-image-upload-btn"
        >
          <span className="item-image-btn-icons">
            <PhotoIcon />
            {hasImage && !uploading ? <ReplaceIcon /> : null}
          </span>
          <span className="item-image-btn-label">
            {uploading ? labels.uploading : hasImage ? labels.changeLabel : labels.uploadLabel}
          </span>
        </button>
        {hasImage ? (
          <button
            type="button"
            className="ui-button ui-button-danger item-image-btn"
            onClick={handleDelete}
            disabled={uploading}
          >
            <span className="item-image-btn-icons">
              <PhotoIcon />
              <DeleteIcon />
            </span>
            <span className="item-image-btn-label">{labels.deleteLabel}</span>
          </button>
        ) : null}
      </div>

      {error ? <p className="ui-note ui-note-error">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={handleFileChange}
        data-testid="item-image-input"
      />
    </div>
  );
}

/**
 * Compress an image using the Canvas API.
 * Downscales to MAX_DIM on the longer side and encodes as JPEG at JPEG_QUALITY.
 * If the result is larger than TARGET_BYTES, retries at lower quality.
 */
async function compressImage(file: File): Promise<File> {
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
