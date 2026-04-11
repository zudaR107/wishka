import { redirect } from "next/navigation";
import { getTranslations } from "@/modules/i18n";
import { PageShell } from "@/shared/ui/page-shell";

const common = getTranslations("common");
const messages = getTranslations("app");

type LoginPageProps = {
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const status = params?.status;
  const errorCode = params?.error;

  return (
    <PageShell
      eyebrow={common.routeSkeleton}
      title={messages.login.title}
      description={messages.login.description}
    >
      {status === "logged-out" ? (
        <p className="ui-message ui-message-success">{messages.login.loggedOutMessage}</p>
      ) : null}
      {errorCode ? (
        <p className="ui-message ui-message-error">{getLoginErrorMessage(errorCode)}</p>
      ) : null}
      <form action={loginAction} className="ui-form">
        <div className="ui-field">
          <label className="ui-label" htmlFor="email">
            {messages.login.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="ui-input"
            required
          />
        </div>
        <div className="ui-field">
          <label className="ui-label" htmlFor="password">
            {messages.login.passwordLabel}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="ui-input"
            required
          />
        </div>
        <button type="submit" className="ui-button">
          {messages.login.submitLabel}
        </button>
      </form>
    </PageShell>
  );
}

async function loginAction(formData: FormData) {
  "use server";

  const [{ loginUser }, { setSessionCookie }] = await Promise.all([
    import("@/modules/auth/server/login"),
    import("@/modules/auth/server/session"),
  ]);

  const result = await loginUser({
    email: getFormValue(formData, "email"),
    password: getFormValue(formData, "password"),
  });

  if (result.status === "success") {
    await setSessionCookie(result.sessionToken, result.expiresAt);
    redirect("/app");
  }

  redirect(`/login?error=${result.code}`);
}

function getFormValue(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function getLoginErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "invalid-input":
      return messages.login.errors.invalidInput;
    case "invalid-credentials":
      return messages.login.errors.invalidCredentials;
    default:
      return messages.login.errors.unknown;
  }
}
