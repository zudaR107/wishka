import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/server/current-user";
import { getTranslations } from "@/modules/i18n";

const common = getTranslations("common");
const messages = getTranslations("app");

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }

  const params = searchParams ? await searchParams : undefined;
  const errorCode = params?.error;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <p className="auth-card-logo">{common.brand}</p>
          <h1 className="auth-card-title">{messages.login.title}</h1>
          <p className="auth-card-description">{messages.login.description}</p>
        </div>

        {errorCode ? (
          <p className="ui-message ui-message-error">{getLoginErrorMessage(errorCode)}</p>
        ) : null}

        <form action={loginAction} className="ui-form" style={{ maxWidth: "none" }}>
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
              maxLength={320}
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
          <button type="submit" className="ui-button ui-button-full">
            {messages.login.submitLabel}
          </button>
        </form>

        <p className="auth-card-footer">
          {messages.login.registerHint}{" "}
          <Link href="/register" className="auth-card-footer-link">
            {messages.login.registerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
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
    redirect("/");
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
