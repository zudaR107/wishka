import { eq } from "drizzle-orm";
import { users } from "@/modules/auth/db/schema";
import { normalizeEmail } from "@/modules/auth/server/email";
import {
  type LoginUserResult,
  validateLoginUserInput,
} from "@/modules/auth/server/login-input";
import { verifyPassword } from "@/modules/auth/server/password";
import { createSession } from "@/modules/auth/server/session";
import { db } from "@/shared/db";

type LoginUserInput = {
  email: string;
  password: string;
};

export async function loginUser({ email, password }: LoginUserInput): Promise<LoginUserResult> {
  const normalizedEmail = normalizeEmail(email);
  const validationResult = validateLoginUserInput({
    email: normalizedEmail,
    password,
  });

  if (validationResult.status === "error") {
    return validationResult;
  }

  try {
    const user = await db.query.users.findFirst({
      columns: {
        id: true,
        passwordHash: true,
      },
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      return { status: "error", code: "invalid-credentials" };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return { status: "error", code: "invalid-credentials" };
    }

    const session = await createSession(user.id);

    return {
      status: "success",
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
    };
  } catch {
    return { status: "error", code: "unknown" };
  }
}
