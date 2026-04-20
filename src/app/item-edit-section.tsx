"use client";

import { useEffect, useRef, useState } from "react";

type ItemEditSectionProps = {
  editLabel: string;
  deleteButton: React.ReactNode;
  children: React.ReactNode;
};

export function ItemEditSection({ editLabel, deleteButton, children }: ItemEditSectionProps) {
  const [open, setOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const formAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const card = sectionRef.current?.closest(".item-card") as HTMLElement | null;
    (card ?? sectionRef.current)?.scrollIntoView({ behavior: "smooth", block: "start" });
    formAreaRef.current?.querySelector<HTMLElement>('[name="title"]')?.focus({ preventScroll: true });
  }, [open]);

  return (
    <div ref={sectionRef} className="item-edit-section">
      <div className="item-card-footer">
        <button
          type="button"
          className="item-edit-btn"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          ✎ {editLabel}
        </button>
        {deleteButton}
      </div>
      {open && (
        <div ref={formAreaRef} className="item-edit-form-inner">
          {children}
        </div>
      )}
    </div>
  );
}
