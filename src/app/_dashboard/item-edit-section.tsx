"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

const ItemEditCloseContext = createContext<() => void>(() => {});

/** Call inside EditItemForm to close the enclosing ItemEditSection on success. */
export function useItemEditClose(): () => void {
  return useContext(ItemEditCloseContext);
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

  useEffect(() => {
    if (!open) return;
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  return (
    <ItemEditCloseContext.Provider value={() => setOpen(false)}>
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
          <div className="item-edit-form-inner">
            {children}
          </div>
        )}
      </div>
    </ItemEditCloseContext.Provider>
  );
}
