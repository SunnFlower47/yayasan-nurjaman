"use server";

/**
 * src/modules/auth/actions/login.action.ts
 * Server Action untuk autentikasi masuk pengurus yayasan.
 */

import { headers, cookies } from "next/headers";
import { loginSchema } from "../schemas/login.schema";
import { authService } from "../services/auth.service";
import { verifyActionOrigin, sanitizeRedirectPath } from "../helpers/origin-checker";
import { getClientIp } from "../helpers/ip";
import { getSessionCookieName } from "../helpers/require-user";
import { SESSION_ABSOLUTE_TIMEOUT_MS } from "../constants";

export interface LoginActionResult {
  success: boolean;
  error?: string | undefined;
  redirectTo?: string | undefined;
}

async function setSessionCookie(sessionToken: string): Promise<void> {
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

function resolveRedirectPath(next?: string, mustChangePassword = false): string {
  if (mustChangePassword) {
    return "/ganti-password";
  }
  return sanitizeRedirectPath(next);
}

export async function loginAction(
  _prevState: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  const reqHeaders = await headers();

  if (!verifyActionOrigin(reqHeaders)) {
    return { success: false, error: "Permintaan dari asal (origin) tidak sah." };
  }

  const rawInput = {
    username: formData.get("username"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  };

  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  const { username, password, next } = parsed.data;
  const ip = getClientIp(reqHeaders);
  const userAgent = reqHeaders.get("user-agent") || undefined;

  const result = await authService.login({ username, password, ip, userAgent });
  if (!result.success || !result.sessionToken) {
    return { success: false, error: result.error || "Gagal masuk ke sistem." };
  }

  await setSessionCookie(result.sessionToken);
  const redirectTo = resolveRedirectPath(next, result.mustChangePassword);

  return { success: true, redirectTo };
}
