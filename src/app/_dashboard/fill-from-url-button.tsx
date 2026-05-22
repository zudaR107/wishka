"use client";

import { useState } from "react";

export type FillFromUrlLabels = {
  label: string;
  noResult: string;
};

export type FillResult = {
  title?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
};

type FillFromUrlButtonProps = {
  /** Returns the current URL field value at call time (avoids stale closure). */
  getUrl: () => string;
  /** When provided, the image is downloaded and saved for this item. */
  itemId?: string;
  onResult: (data: FillResult) => void;
  labels: FillFromUrlLabels;
};

/**
 * Small inline button that fires a POST /api/parse-product-url request and
 * calls onResult with the parsed data. Renders nothing visible when the URL
 * is empty (detected lazily on click, not reactively, to avoid re-renders).
 */
export function FillFromUrlButton({
  getUrl,
  itemId,
  onResult,
  labels,
}: FillFromUrlButtonProps) {
  const [filling, setFilling] = useState(false);
  const [noResult, setNoResult] = useState(false);

  async function handleClick() {
    const url = getUrl().trim();
    if (!url) return;

    setFilling(true);
    setNoResult(false);

    try {
      const res = await fetch("/api/parse-product-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, itemId }),
      });

      const data: FillResult = res.ok ? ((await res.json()) as FillResult) : {};

      if (!data.title && data.price === undefined && !data.imageUrl) {
        setNoResult(true);
        return;
      }

      onResult(data);
    } catch {
      setNoResult(true);
    } finally {
      setFilling(false);
    }
  }

  return (
    <div className="fill-from-url">
      <button
        type="button"
        className="ui-button ui-button-soft fill-from-url-btn"
        onClick={handleClick}
        disabled={filling}
      >
        {filling ? (
          <span className="fill-from-url-spinner" aria-hidden="true" />
        ) : (
          <FillIcon />
        )}
        {labels.label}
      </button>
      {noResult ? (
        <p className="ui-note ui-note-error fill-from-url-error">{labels.noResult}</p>
      ) : null}
    </div>
  );
}

function FillIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}
