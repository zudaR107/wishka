"use client";

import { useState } from "react";

type CopyUrlButtonProps = {
  url: string;
};

export function CopyUrlButton({ url }: CopyUrlButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    let success = false;

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        success = true;
      } catch {
        // fall through to execCommand
      }
    }

    if (!success) {
      try {
        const el = document.createElement("textarea");
        el.value = url;
        el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(el);
        el.focus();
        el.select();
        success = document.execCommand("copy");
        document.body.removeChild(el);
      } catch {
        // clipboard unavailable
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
