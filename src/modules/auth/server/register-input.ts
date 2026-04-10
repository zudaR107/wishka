import { normalizeEmail } from "@/modules/auth/server/email";

const MIN_PASSWORD_LENGTH = 8;

export type RegisterUserResult =
  | { status: "success" }
  | { status: "error"; code: "invalid-email" | "password-too-short" | "email-taken" | "unknown" };

type RegisterUserInput = {
  email: string;
  password: string;
};

export function validateRegisterUserInput({ email, password }: RegisterUserInput): RegisterUserResult {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    return { status: "error", code: "invalid-email" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { status: "error", code: "password-too-short" };
  }

  return { status: "success" };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export { MIN_PASSWORD_LENGTH };
