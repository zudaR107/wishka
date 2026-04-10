import Link from "next/link";
import { PageShell } from "@/components/page-shell";

const routes = [
  { href: "/login", label: "Login skeleton" },
  { href: "/register", label: "Register skeleton" },
  { href: "/app", label: "App shell" },
  { href: "/app/reservations", label: "Reservations shell" },
  { href: "/share/demo-token", label: "Public share shell" },
];

export default function HomePage() {
  return (
    <PageShell
      eyebrow="Wishka"
      title="Minimal wishlist app foundation"
      description="This route anchors the initial application shell for Milestone 1."
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-600">
          The routes below are placeholders only and intentionally contain no business logic yet.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {routes.map((route) => (
            <li key={route.href}>
              <Link
                href={route.href}
                className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                {route.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
