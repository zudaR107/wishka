"use client";

import { useEffect, useRef, useState } from "react";

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

type ItemEditSectionProps = {
  editLabel: string;
  reserveButton?: React.ReactNode;
  deleteButton: React.ReactNode;
  children: React.ReactNode;
};

export function ItemEditSection({ editLabel, reserveButton, deleteButton, children }: ItemEditSectionProps) {
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
        <div className="item-footer-start">
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
        </div>
        <div className="item-footer-center">
          {reserveButton}
        </div>
        <div className="item-footer-end">
          {deleteButton}
        </div>
      </div>
      {open && (
        <div ref={formAreaRef} className="item-edit-form-inner">
          {children}
        </div>
      )}
    </div>
  );
}
