import { eq } from "drizzle-orm";
import { users } from "@/modules/auth/db/schema";

const BIO_MAX_LENGTH = 500;

export type UpdateBioResult =
  | { status: "success" }
  | { status: "error"; code: "too-long" | "db-error" };

export async function updateUserBio(
  userId: string,
  rawBio: string,
): Promise<UpdateBioResult> {
  const bio = rawBio.trim() || null;

  if (bio !== null && bio.length > BIO_MAX_LENGTH) {
    return { status: "error", code: "too-long" };
  }

  try {
    const { db } = await import("@/shared/db");

    await db
      .update(users)
      .set({ bio, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { status: "success" };
  } catch {
    return { status: "error", code: "db-error" };
  }
}

export type UpdatePreferredCurrencyResult =
  | { status: "success" }
  | { status: "error"; code: "db-error" };

export async function updateUserPreferredCurrency(
  userId: string,
  currency: string,
): Promise<UpdatePreferredCurrencyResult> {
  try {
    const { db } = await import("@/shared/db");

    await db
      .update(users)
      .set({ preferredCurrency: currency, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { status: "success" };
  } catch {
    return { status: "error", code: "db-error" };
  }
}

export async function getUserProfile(
  userId: string,
): Promise<{ id: string; email: string; bio: string | null; preferredCurrency: string } | null> {
  const { db } = await import("@/shared/db");

  const user = await db.query.users.findFirst({
    columns: { id: true, email: true, bio: true, preferredCurrency: true },
    where: eq(users.id, userId),
  });

  return user ?? null;
}
