"use client";

import Link from "next/link";
import { useActionState } from "react";
import { getTranslations } from "@/modules/i18n";
import { PasswordInput } from "@/shared/ui/password-input";
import { registerAction, type RegisterState } from "./actions";

const messages = getTranslations("app");

const MIN_PASSWORD_LENGTH = 8;

function getErrorMessage(code: string): string {
  const errs = messages.register.errors;
  switch (code) {
    case "invalid-email":
      return errs.invalidEmail;
    case "password-too-short":
      return errs.passwordTooShort;
    case "passwords-dont-match":
      return errs.passwordMismatch;
    case "email-taken":
      return errs.emailTaken;
    case "consent-required":
      return errs.consentRequired;
    default:
      return errs.unknown;
  }
}

export function RegisterForm() {
  const [state, action] = useActionState<RegisterState, FormData>(registerAction, null);
  const err = state?.error ?? null;

  return (
    <>
      {err ? (
        <p className="ui-message ui-message-error">{getErrorMessage(err)}</p>
      ) : null}
      <form key={state?.key ?? 0} action={action} className="ui-form" style={{ maxWidth: "none" }} noValidate>
        <div className="ui-field">
          <label className="ui-label" htmlFor="email">
            {messages.register.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={err === "invalid-email" || err === "email-taken" ? "ui-input ui-input-error" : "ui-input"}
            required
            maxLength={320}
            defaultValue={state?.values?.email ?? ""}
          />
        </div>
        <div className="ui-field">
          <label className="ui-label" htmlFor="password">
            {messages.register.passwordLabel}
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            error={err === "password-too-short"}
          />
          <p className="ui-note">{messages.register.minPasswordHint}</p>
        </div>
        <div className="ui-field">
          <label className="ui-label" htmlFor="confirmPassword">
            {messages.register.confirmPasswordLabel}
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            error={err === "passwords-dont-match"}
          />
        </div>
        <div className="ui-consent">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            className="ui-consent-checkbox"
            defaultChecked={state?.values?.consent ?? false}
          />
          <label htmlFor="consent" className="ui-consent-label">
            {messages.register.consentPrefix}{" "}
            <Link href="/privacy" className="ui-consent-link" target="_blank">
              {messages.register.consentLinkLabel}
            </Link>{" "}
            {messages.register.consentSuffix}
          </label>
        </div>
        <button type="submit" className="ui-button ui-button-full">
          {messages.register.submitLabel}
        </button>
      </form>
    </>
  );
}
