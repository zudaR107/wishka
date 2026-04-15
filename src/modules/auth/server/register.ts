"use server";

import { eq } from "drizzle-orm";
import { DatabaseError } from "pg";
import { users } from "@/modules/auth/db/schema";
import { normalizeEmail } from "@/modules/auth/server/email";
import { hashPassword } from "@/modules/auth/server/password";
import {
  type RegisterUserResult,
  validateRegisterUserInput,
} from "@/modules/auth/server/register-input";
import { db } from "@/shared/db";

type RegisterUserInput = {
  email: string;
  password: string;
};

export async function registerUser({ email, password }: RegisterUserInput): Promise<RegisterUserResult> {
  const normalizedEmail = normalizeEmail(email);
  const validationResult = validateRegisterUserInput({
    email: normalizedEmail,
    password,
  });

  if (validationResult.status === "error") {
    return validationResult;
  }

  const existingUser = await db.query.users.findFirst({
    columns: { id: true },
    where: eq(users.email, normalizedEmail),
  });

  if (existingUser) {
    return { status: "error", code: "email-taken" };
  }

  const passwordHash = await hashPassword(password);

  try {
    const [inserted] = await db.insert(users).values({
      email: normalizedEmail,
      passwordHash,
    }).returning({ id: users.id });

    return { status: "success", userId: inserted.id };
  } catch (error) {
    if (isUniqueEmailViolation(error)) {
      return { status: "error", code: "email-taken" };
    }

    return { status: "error", code: "unknown" };
  }
}

function isUniqueEmailViolation(error: unknown): boolean {
  return error instanceof DatabaseError && error.code === "23505";
}
