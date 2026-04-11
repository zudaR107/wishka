import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth/server/current-user";
import { getTranslations } from "@/modules/i18n";
import { PageShell } from "@/shared/ui/page-shell";

const common = getTranslations("common");
const messages = getTranslations("app");

export default async function AppPage() {
  await requireCurrentUser();

  return (
    <PageShell
      eyebrow={common.routeSkeleton}
      title={messages.dashboard.title}
      description={messages.dashboard.description}
    >
      <form action={logoutAction}>
        <button type="submit" className="ui-button">
          {messages.dashboard.logoutLabel}
        </button>
      </form>
    </PageShell>
  );
}

async function logoutAction() {
  "use server";

  const cookieStore = await cookies();
  const [{ AUTH_SESSION_COOKIE_NAME, clearSessionCookie }, { logoutUser }] = await Promise.all([
    import("@/modules/auth/server/session"),
    import("@/modules/auth/server/logout"),
  ]);

  await logoutUser(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);
  await clearSessionCookie();

  redirect("/login?status=logged-out");
}
