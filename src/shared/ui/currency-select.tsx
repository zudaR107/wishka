"use client";

import { useState, useRef, useEffect } from "react";
import { type CurrencyCode, SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from "@/shared/lib/currency";
import { useTranslations } from "@/modules/i18n";

function ChevronDownIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, transition: "transform 150ms ease", ...style }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

type CurrencySelectProps = {
  name: string;
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  label: string;
  align?: "left" | "right";
};

export function CurrencySelect({ name, value, onChange, label, align = "left" }: CurrencySelectProps) {
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="currency-select">
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        className="currency-select-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
      >
        <span>{CURRENCY_SYMBOLS[value]}</span>
        <ChevronDownIcon style={{ transform: open ? "rotate(180deg)" : undefined }} />
      </button>

      {open && (
        <ul className={`currency-select-menu currency-select-menu--${align}`} role="listbox">
          {SUPPORTED_CURRENCIES.map((code) => (
            <li key={code} role="option" aria-selected={code === value}>
              <button
                type="button"
                className={`currency-select-item${code === value ? " currency-select-item--selected" : ""}`}
                onClick={() => {
                  onChange(code);
                  setOpen(false);
                }}
              >
                {common.currencies[code]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
