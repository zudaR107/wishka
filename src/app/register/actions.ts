"use server";

import { redirect } from "next/navigation";

export type RegisterState = {
  error: string;
  key: number;
  values: { email: string; consent: boolean };
} | null;

export async function registerAction(
  prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = getString(formData, "email");
  const consent = formData.get("consent") === "on";

  if (!consent) {
    return { error: "consent-required", key: (prev?.key ?? 0) + 1, values: { email, consent } };
  }

  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (password !== confirmPassword) {
    return { error: "passwords-dont-match", key: (prev?.key ?? 0) + 1, values: { email, consent } };
  }

  const { registerUser } = await import("@/modules/auth/server/register");
  const { createSession, setSessionCookie } = await import("@/modules/auth/server/session");

  const result = await registerUser({ email, password });

  if (result.status === "success") {
    const session = await createSession(result.userId);
    await setSessionCookie(session.sessionToken, session.expiresAt);
    redirect("/");
  }

  return { error: result.code, key: (prev?.key ?? 0) + 1, values: { email, consent } };
}

function getString(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}
