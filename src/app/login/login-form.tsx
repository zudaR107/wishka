"use client";

import { useActionState } from "react";
import { getTranslations } from "@/modules/i18n";
import { PasswordInput } from "@/shared/ui/password-input";
import { loginAction, type LoginState } from "./actions";

const messages = getTranslations("app");

function getErrorMessage(code: string): string {
  switch (code) {
    case "invalid-input":
      return messages.login.errors.invalidInput;
    case "invalid-credentials":
      return messages.login.errors.invalidCredentials;
    default:
      return messages.login.errors.unknown;
  }
}

export function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, null);
  const err = state?.error ?? null;

  return (
    <>
      {err ? (
        <p className="ui-message ui-message-error">{getErrorMessage(err)}</p>
      ) : null}
      <form key={state?.key ?? 0} action={action} className="ui-form" style={{ maxWidth: "none" }} noValidate>
        <div className="ui-field">
          <label className="ui-label" htmlFor="email">
            {messages.login.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={err ? "ui-input ui-input-error" : "ui-input"}
            required
            maxLength={320}
            defaultValue={state?.values?.email ?? ""}
          />
        </div>
        <div className="ui-field">
          <label className="ui-label" htmlFor="password">
            {messages.login.passwordLabel}
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            error={!!err}
          />
        </div>
        <button type="submit" className="ui-button ui-button-full">
          {messages.login.submitLabel}
        </button>
      </form>
    </>
  );
}
