"use server";

import { redirect } from "next/navigation";

export type LoginState = {
  error: string;
  key: number;
  values: { email: string };
} | null;

export async function loginAction(
  prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  const [{ loginUser }, { setSessionCookie }] = await Promise.all([
    import("@/modules/auth/server/login"),
    import("@/modules/auth/server/session"),
  ]);

  const result = await loginUser({ email, password });

  if (result.status === "success") {
    await setSessionCookie(result.sessionToken, result.expiresAt);
    redirect("/");
  }

  return { error: result.code, key: (prev?.key ?? 0) + 1, values: { email } };
}

function getString(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}
