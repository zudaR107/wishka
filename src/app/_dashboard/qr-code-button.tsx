"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

type QrCodeButtonLabels = {
  qrLabel: string;
  qrDialogTitle: string;
  qrDownloadLabel: string;
  qrCloseLabel: string;
};

type QrCodeButtonProps = {
  url: string;
  labels: QrCodeButtonLabels;
};

export function QrCodeButton({ url, labels }: QrCodeButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) {
      dialogRef.current?.close();
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qr-code.png";
    a.click();
  }

  return (
    <>
      <button
        type="button"
        className="copy-url-btn"
        onClick={() => dialogRef.current?.showModal()}
        title={labels.qrLabel}
        aria-label={labels.qrLabel}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="currentColor"
          aria-hidden="true"
        >
          {/* Top-left finder pattern */}
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="2.5" y="2.5" width="3" height="3" rx="0.5" fill="var(--color-bg-canvas)" />
          {/* Top-right finder pattern */}
          <rect x="11" y="1" width="6" height="6" rx="1" />
          <rect x="12.5" y="2.5" width="3" height="3" rx="0.5" fill="var(--color-bg-canvas)" />
          {/* Bottom-left finder pattern */}
          <rect x="1" y="11" width="6" height="6" rx="1" />
          <rect x="2.5" y="12.5" width="3" height="3" rx="0.5" fill="var(--color-bg-canvas)" />
          {/* Data dots */}
          <rect x="11" y="11" width="2" height="2" rx="0.4" />
          <rect x="14" y="11" width="2" height="2" rx="0.4" />
          <rect x="11" y="14" width="2" height="2" rx="0.4" />
          <rect x="14" y="14" width="2" height="2" rx="0.4" />
        </svg>
      </button>

      <dialog ref={dialogRef} className="qr-dialog" onClick={handleBackdropClick}>
        <div className="qr-dialog-inner">
          <h2 className="qr-dialog-title">{labels.qrDialogTitle}</h2>
          <div className="qr-dialog-code" ref={canvasRef}>
            <QRCodeCanvas
              value={url}
              size={220}
              marginSize={2}
              level="M"
            />
          </div>
          <p className="qr-dialog-url">{url}</p>
          <div className="qr-dialog-actions">
            <button type="button" className="ui-button" onClick={handleDownload}>
              {labels.qrDownloadLabel}
            </button>
            <button
              type="button"
              className="ui-button ui-button-soft"
              onClick={() => dialogRef.current?.close()}
            >
              {labels.qrCloseLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
