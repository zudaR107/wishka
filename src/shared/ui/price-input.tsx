"use client";

import { useState } from "react";
import { MAX_PRICE } from "@/modules/wishlist/server/item-input";

type PriceInputProps = {
  id: string;
  name: string;
  defaultValue?: string;
  className?: string;
  autoFocus?: boolean;
  error?: boolean;
};

type InputHint = "non-numeric" | "too-large" | null;

const ALLOWED_KEYS = new Set([
  "Backspace", "Delete", "Tab", "Escape", "Enter",
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "Home", "End",
]);

const MAX_PRICE_DISPLAY = MAX_PRICE.toLocaleString("ru-RU");

export function PriceInput({ id, name, defaultValue, className, autoFocus, error }: PriceInputProps) {
  const [hint, setHint] = useState<InputHint>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (ALLOWED_KEYS.has(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setHint("non-numeric");
      return;
    }
    const { value, selectionStart, selectionEnd } = e.currentTarget;
    const before = value.slice(0, selectionStart ?? value.length);
    const after = value.slice(selectionEnd ?? value.length);
    const next = Number(before + e.key + after);
    if (next > MAX_PRICE) {
      e.preventDefault();
      setHint("too-large");
    } else {
      setHint(null);
    }
  }

  function handleInput(e: React.FormEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const filtered = input.value.replace(/[^0-9]/g, "");
    if (filtered !== input.value) {
      input.value = filtered;
      setHint("non-numeric");
      return;
    }
    if (Number(filtered) > MAX_PRICE) {
      input.value = String(MAX_PRICE);
      setHint("too-large");
      return;
    }
    setHint(null);
  }

  function handleBlur() {
    setHint(null);
  }

  return (
    <>
      <input
        id={id}
        name={name}
        defaultValue={defaultValue}
        className={error ? `${className ?? ""} ui-input-error`.trim() : className}
        inputMode="numeric"
        min="0"
        autoComplete="off"
        autoFocus={autoFocus}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onBlur={handleBlur}
      />
      {hint === "non-numeric" ? (
        <p className="ui-note" style={{ color: "var(--color-status-reserved)" }}>
          Только целые числа, например 1990.
        </p>
      ) : hint === "too-large" ? (
        <p className="ui-note" style={{ color: "var(--color-status-reserved)" }}>
          Слишком большое число. Максимум: {MAX_PRICE_DISPLAY}.
        </p>
      ) : null}
    </>
  );
}
