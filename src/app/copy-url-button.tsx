"use client";

import { useState } from "react";

type CopyUrlButtonProps = {
  url: string;
};

export function CopyUrlButton({ url }: CopyUrlButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  }

  return (
    <button
      type="button"
      className="copy-url-btn"
      data-copied={copied}
      onClick={handleCopy}
      title={copied ? "Скопировано" : "Скопировать ссылку"}
      aria-label={copied ? "Скопировано" : "Скопировать ссылку"}
    >
      {copied ? "✓" : "⧉"}
    </button>
  );
}
