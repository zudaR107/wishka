import { deleteSession } from "@/modules/auth/server/session";

export async function logoutUser(sessionToken: string | undefined) {
  if (!sessionToken) {
    return;
  }

  await deleteSession(sessionToken);
}
