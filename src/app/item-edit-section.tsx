"use client";

import { useEffect, useRef, useState } from "react";

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

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
          data-testid="edit-item-toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <PencilIcon />
          <span className="item-btn-label">{editLabel}</span>
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
