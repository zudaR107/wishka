import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/server/current-user";
import { MIN_PASSWORD_LENGTH } from "@/modules/auth/server/register-input";
import { getTranslations } from "@/modules/i18n";

const common = getTranslations("common");
const messages = getTranslations("app");

type RegisterPageProps = {
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
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
          <h1 className="auth-card-title">{messages.register.title}</h1>
          <p className="auth-card-description">{messages.register.description}</p>
        </div>

        {errorCode ? (
          <p className="ui-message ui-message-error">{getRegisterErrorMessage(errorCode)}</p>
        ) : null}

        <form action={registerAction} className="ui-form" style={{ maxWidth: "none" }}>
          <div className="ui-field">
            <label className="ui-label" htmlFor="email">
              {messages.register.emailLabel}
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
              {messages.register.passwordLabel}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              className="ui-input"
              required
            />
            <p className="ui-note">{messages.register.minPasswordHint}</p>
          </div>
          <button type="submit" className="ui-button ui-button-full">
            {messages.register.submitLabel}
          </button>
        </form>

        <p className="auth-card-footer">
          {messages.register.loginHint}{" "}
          <Link href="/login" className="auth-card-footer-link">
            {messages.register.loginLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}

async function registerAction(formData: FormData) {
  "use server";

  const { registerUser } = await import("@/modules/auth/server/register");
  const { createSession, setSessionCookie } = await import("@/modules/auth/server/session");

  const result = await registerUser({
    email: getFormValue(formData, "email"),
    password: getFormValue(formData, "password"),
  });

  if (result.status === "success") {
    const session = await createSession(result.userId);
    await setSessionCookie(session.sessionToken, session.expiresAt);
    redirect("/");
  }

  redirect(`/register?error=${result.code}`);
}

function getFormValue(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function getRegisterErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "invalid-email":
      return messages.register.errors.invalidEmail;
    case "password-too-short":
      return messages.register.errors.passwordTooShort;
    case "email-taken":
      return messages.register.errors.emailTaken;
    default:
      return messages.register.errors.unknown;
  }
}
