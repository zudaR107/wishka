import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { sessions, users } from "@/modules/auth/db/schema";
import { AUTH_SESSION_COOKIE_NAME } from "@/modules/auth/server/session";

type CurrentSession = {
  id: string;
  userId: string;
  sessionToken: string;
  expiresAt: Date;
};

export type CurrentUser = {
  id: string;
  email: string;
};

export async function getCurrentSessionToken() {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
}

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const sessionToken = await getCurrentSessionToken();

  if (!sessionToken) {
    return null;
  }

  const db = await getDb();

  const session = await db.query.sessions.findFirst({
    columns: {
      id: true,
      userId: true,
      sessionToken: true,
      expiresAt: true,
    },
    where: and(
      eq(sessions.sessionToken, sessionToken),
      gt(sessions.expiresAt, new Date()),
    ),
  });

  if (session) {
    return session;
  }

  return null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const db = await getDb();

  const user = await db.query.users.findFirst({
    columns: {
      id: true,
      email: true,
    },
    where: eq(users.id, session.userId),
  });

  return user ?? null;
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (user) {
    return user;
  }

  redirect("/login");
}

async function getDb() {
  const { db } = await import("@/shared/db");

  return db;
}
