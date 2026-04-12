import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { sessions } from "@/modules/auth/db/schema";

export const AUTH_SESSION_COOKIE_NAME = "wshka_session";

const SESSION_TOKEN_LENGTH = 32;
const SESSION_TTL_DAYS = 30;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export async function createSession(userId: string) {
  const db = await getDb();
  const sessionToken = randomBytes(SESSION_TOKEN_LENGTH).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    userId,
    sessionToken,
    expiresAt,
  });

  return {
    sessionToken,
    expiresAt,
  };
}

export async function deleteSession(sessionToken: string) {
  const db = await getDb();

  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

export async function setSessionCookie(sessionToken: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

async function getDb() {
  const { db } = await import("@/shared/db");

  return db;
}
