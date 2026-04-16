"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTranslations } from "@/modules/i18n";

const messages = getTranslations("common");

const STORAGE_KEY = "cookie-notice-dismissed";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Уведомление об использовании cookie">
      <div className="cookie-banner-inner">
        <p className="cookie-banner-text">
          {messages.cookieBanner.text}{" "}
          <Link href="/privacy#cookie" className="cookie-banner-link">
            {messages.cookieBanner.linkLabel}
          </Link>
        </p>
        <div className="cookie-banner-actions">
          <button
            type="button"
            className="ui-button ui-button-secondary"
            onClick={dismiss}
          >
            {messages.cookieBanner.dismissLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
