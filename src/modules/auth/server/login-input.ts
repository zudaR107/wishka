import { isValidEmail, normalizeEmail } from "@/modules/auth/server/email";

export type LoginUserResult =
  | { status: "success"; sessionToken: string; expiresAt: Date }
  | { status: "error"; code: "invalid-input" | "invalid-credentials" | "unknown" };

type LoginUserInput = {
  email: string;
  password: string;
};

export function validateLoginUserInput({ email, password }: LoginUserInput) {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail) || password.length === 0) {
    return { status: "error", code: "invalid-input" } as const;
  }

  return { status: "success" } as const;
}
