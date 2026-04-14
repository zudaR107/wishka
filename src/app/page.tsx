import Link from "next/link";
import { getTranslations } from "@/modules/i18n";

const messages = getTranslations("app");

const devLinks = [
  { href: "/login", label: messages.home.devLinks.login },
  { href: "/register", label: messages.home.devLinks.register },
  { href: "/app", label: messages.home.devLinks.app },
  { href: "/app/reservations", label: messages.home.devLinks.reservations },
  { href: "/share/demo-token", label: messages.home.devLinks.share },
];

export default function HomePage() {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <>
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <h1 className="home-hero-title">{messages.home.heroTitle}</h1>
          <p className="home-hero-description">{messages.home.heroDescription}</p>
          <div className="home-hero-actions">
            <Link href="/register" className="ui-button home-hero-cta">
              {messages.home.ctaRegister}
            </Link>
            <Link href="/login" className="ui-button ui-button-secondary home-hero-cta">
              {messages.home.ctaLogin}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="home-section-inner">
          <h2 className="home-section-title">{messages.home.featuresTitle}</h2>
          <ul className="home-features-grid">
            {messages.home.features.map((feature) => (
              <li key={feature.title} className="home-feature-card">
                <span className="home-feature-icon">{feature.icon}</span>
                <h3 className="home-feature-title">{feature.title}</h3>
                <p className="home-feature-description">{feature.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Dev block — only in development */}
      {isDev ? (
        <section className="home-section-inner home-dev-section">
          <div className="home-dev-card">
            <div className="home-dev-header">
              <span className="home-dev-badge">DEV</span>
              <div>
                <h2 className="home-dev-title">{messages.home.devTitle}</h2>
                <p className="home-dev-description">{messages.home.devDescription}</p>
              </div>
            </div>
            <ul className="home-dev-links">
              {devLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="home-dev-link">
                    {link.label}
                    <span className="home-dev-link-path">{link.href}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
