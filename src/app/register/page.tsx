import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Регистрация",
  robots: { index: false },
};
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/server/current-user";
import { getTranslations } from "@/modules/i18n";
import { RegisterForm } from "./register-form";

const common = getTranslations("common");
const messages = getTranslations("app");

export default async function RegisterPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <p className="auth-card-logo">{common.brand}</p>
          <h1 className="auth-card-title">{messages.register.title}</h1>
          <p className="auth-card-description">{messages.register.description}</p>
        </div>

        <RegisterForm />

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
