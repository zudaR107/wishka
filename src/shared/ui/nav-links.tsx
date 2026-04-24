"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getTranslations } from "@/modules/i18n";

const common = getTranslations("common");

type NavLinksProps = {
  email: string;
  onLogout: () => Promise<void>;
};

export function NavLinks({ email, onLogout }: NavLinksProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isSettingsActive = pathname === "/settings";
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <nav className="site-nav">
      <Link
        href="/"
        className={`site-nav-link${pathname === "/" ? " site-nav-link--active" : ""}`}
      >
        {common.nav.wishlist}
      </Link>
      <Link
        href="/reservations"
        className={`site-nav-link${pathname === "/reservations" ? " site-nav-link--active" : ""}`}
      >
        {common.nav.reservations}
      </Link>
      <div className="site-nav-menu" ref={menuRef}>
        <button
          type="button"
          className={`site-nav-gear${isSettingsActive ? " site-nav-gear--active" : ""}`}
          aria-label={common.nav.accountMenu}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        {open && (
          <div className="site-nav-dropdown">
            <span className="site-nav-dropdown-email">{email}</span>
            <div className="site-nav-dropdown-divider" />
            <Link
              href="/settings"
              className="site-nav-dropdown-item"
              onClick={() => setOpen(false)}
            >
              {common.nav.settings}
            </Link>
            <form action={onLogout}>
              <button type="submit" className="site-nav-dropdown-item">
                {common.nav.logout}
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}

export function GuestLinks() {
  const pathname = usePathname();

  return (
    <nav className="site-nav site-nav--guest">
      <Link
        href="/login"
        className={`site-nav-link${pathname === "/login" ? " site-nav-link--active" : ""}`}
      >
        {common.nav.login}
      </Link>
      <Link href="/register" className="ui-button">
        {common.nav.register}
      </Link>
    </nav>
  );
}
