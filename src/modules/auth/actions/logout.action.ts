"use server";

/**
 * src/modules/auth/actions/logout.action.ts
 * Server Action untuk keluar dari sesi admin dan mencabut sesi di database.
 */

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionService } from "../services/session.service";
import { verifyActionOrigin } from "../helpers/origin-checker";
import { getSessionCookieName } from "../helpers/require-user";

export async function logoutAction(): Promise<void> {
  const reqHeaders = await headers();

  if (!verifyActionOrigin(reqHeaders)) {
    throw new Error("Permintaan dari asal (origin) tidak sah.");
  }

  const cookieStore = await cookies();
  const cookieName = getSessionCookieName();
  const token = cookieStore.get(cookieName)?.value;

  if (token) {
    const session = await sessionService.validateSession(token);
    if (session) {
      await sessionService.revokeSession(session.id, "USER_LOGOUT");
    }
  }

  const isProd = process.env.NODE_ENV === "production";
  cookieStore.set(cookieName, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
  });
  redirect("/masuk");
}
