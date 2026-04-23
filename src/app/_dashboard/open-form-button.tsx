"use client";

import { useEffect } from "react";

type OpenFormButtonProps = {
  formId: string;
  inputName: string;
  className?: string;
  children: React.ReactNode;
};

export function OpenFormButton({ formId, inputName, className, children }: OpenFormButtonProps) {
  return (
    <button
      className={className}
      onClick={() => {
        const details = document.getElementById(formId) as HTMLDetailsElement | null;
        if (!details) return;
        details.open = true;
        details.scrollIntoView({ behavior: "smooth", block: "start" });
        details.querySelector<HTMLElement>(`[name="${inputName}"]`)?.focus({ preventScroll: true });
      }}
    >
      {children}
    </button>
  );
}

type AddItemFormFocusProps = {
  formId: string;
  inputName: string;
};

export function AddItemFormFocus({ formId, inputName }: AddItemFormFocusProps) {
  useEffect(() => {
    const details = document.getElementById(formId) as HTMLDetailsElement | null;
    if (!details) return;

    function handleToggle() {
      if (!details!.open) return;
      details!.scrollIntoView({ behavior: "smooth", block: "start" });
      details!.querySelector<HTMLElement>(`[name="${inputName}"]`)?.focus({ preventScroll: true });
    }

    details.addEventListener("toggle", handleToggle);
    return () => details.removeEventListener("toggle", handleToggle);
  }, [formId, inputName]);

  return null;
}
