"use client";

import { useState } from "react";

type PriceInputProps = {
  id: string;
  name: string;
  defaultValue?: string;
  className?: string;
};

const ALLOWED_KEYS = new Set([
  "Backspace", "Delete", "Tab", "Escape", "Enter",
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "Home", "End",
]);

export function PriceInput({ id, name, defaultValue, className }: PriceInputProps) {
  const [error, setError] = useState(false);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (ALLOWED_KEYS.has(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setError(true);
    } else {
      setError(false);
    }
  }

  function handleInput(e: React.FormEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const filtered = input.value.replace(/[^0-9]/g, "");
    if (filtered !== input.value) {
      input.value = filtered;
      setError(true);
    }
  }

  function handleBlur() {
    setError(false);
  }

  return (
    <>
      <input
        id={id}
        name={name}
        defaultValue={defaultValue}
        className={className}
        inputMode="numeric"
        min="0"
        autoComplete="off"
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onBlur={handleBlur}
      />
      {error ? (
        <p className="ui-note" style={{ color: "var(--color-status-reserved)" }}>
          Только целые числа, например 1990.
        </p>
      ) : null}
    </>
  );
}
