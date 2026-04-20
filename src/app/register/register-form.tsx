"use client";

import Link from "next/link";
import { useActionState } from "react";
import { getTranslations } from "@/modules/i18n";
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

  return (
    <>
      {state?.error ? (
        <p className="ui-message ui-message-error">{getErrorMessage(state.error)}</p>
      ) : null}
      <form key={state?.key ?? 0} action={action} className="ui-form" style={{ maxWidth: "none" }}>
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
            defaultValue={state?.values?.email ?? ""}
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
