/**
 * src/modules/auth/helpers/cookies.ts
 * Utilitas pengelolaan cookie sesi aman (HttpOnly, Secure, SameSite=Lax).
 */

import { cookies } from "next/headers";
import { getSessionCookieName } from "./require-user";
import { SESSION_ABSOLUTE_TIMEOUT_MS } from "../constants";

export async function setSessionCookie(sessionToken: string): Promise<void> {
  const isProd = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();

  cookieStore.set(getSessionCookieName(), sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge: Math.floor(SESSION_ABSOLUTE_TIMEOUT_MS / 1000),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(getSessionCookieName());
}
