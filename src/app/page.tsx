import { getTranslations } from "@/modules/i18n";
import { LinkCard } from "@/shared/ui/link-card";
import { PageShell } from "@/shared/ui/page-shell";

const common = getTranslations("common");
const messages = getTranslations("app");

const routes = [
  { href: "/login", label: messages.home.links.login },
  { href: "/register", label: messages.home.links.register },
  { href: "/app", label: messages.home.links.app },
  { href: "/app/reservations", label: messages.home.links.reservations },
  { href: "/share/demo-token", label: messages.home.links.share },
];

export default function HomePage() {
  return (
    <PageShell
      eyebrow={common.brand}
      title={messages.home.title}
      description={messages.home.description}
    >
      <div className="space-y-5">
        <p
          className="max-w-2xl"
          style={{
            color: "var(--color-text-base)",
            fontSize: "var(--font-size-label)",
            lineHeight: "var(--line-height-body)",
          }}
        >
          {messages.home.routesHint}
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {routes.map((route) => (
            <li key={route.href}>
              <LinkCard href={route.href} label={route.label} />
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
