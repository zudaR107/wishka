import Link from "next/link";
import { getTranslations } from "@/modules/i18n";
import pkg from "../../../package.json";

const common = getTranslations("common");

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p>
          <a
            href="https://github.com/zudaR107/wshka"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-link"
          >
            {common.footer.copyright}
          </a>
          <Link href="/roadmap" className="site-footer-link" style={{ marginLeft: "var(--space-2)", opacity: 0.5 }}>
            v{pkg.version}
          </Link>
        </p>
        <nav className="site-footer-links">
          <Link href="/privacy" className="site-footer-link">
            {common.footer.privacy}
          </Link>
          <Link href="/terms" className="site-footer-link">
            {common.footer.terms}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
