import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Войти",
  robots: { index: false },
};
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/server/current-user";
import { getTranslations } from "@/modules/i18n";
import { LoginForm } from "./login-form";

const common = getTranslations("common");
const messages = getTranslations("app");

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <p className="auth-card-logo">{common.brand}</p>
          <h1 className="auth-card-title">{messages.login.title}</h1>
          <p className="auth-card-description">{messages.login.description}</p>
        </div>

        <LoginForm />

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
