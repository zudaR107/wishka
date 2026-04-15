"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getTranslations } from "@/modules/i18n";

const common = getTranslations("common");

type NavLinksProps = {
  onLogout: () => Promise<void>;
};

export function NavLinks({ onLogout }: NavLinksProps) {
  const pathname = usePathname();

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
      <form action={onLogout}>
        <button type="submit" className="ui-button ui-button-secondary">
          {common.nav.logout}
        </button>
      </form>
    </nav>
  );
}

export function GuestLinks() {
  const pathname = usePathname();

  return (
    <nav className="site-nav">
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
