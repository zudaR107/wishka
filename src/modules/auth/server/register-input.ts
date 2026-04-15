import { isValidEmail, normalizeEmail } from "@/modules/auth/server/email";

const MIN_PASSWORD_LENGTH = 8;

export type RegisterUserResult =
  | { status: "success"; userId: string }
  | { status: "error"; code: "invalid-email" | "password-too-short" | "email-taken" | "unknown" };

type RegisterValidationResult =
  | { status: "success" }
  | { status: "error"; code: "invalid-email" | "password-too-short" | "email-taken" | "unknown" };

type RegisterUserInput = {
  email: string;
  password: string;
};

export function validateRegisterUserInput({ email, password }: RegisterUserInput): RegisterValidationResult {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    return { status: "error", code: "invalid-email" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { status: "error", code: "password-too-short" };
  }

  return { status: "success" };
}
export { MIN_PASSWORD_LENGTH };
