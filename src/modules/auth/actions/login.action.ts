"use server";

/**
 * src/modules/auth/actions/login.action.ts
 * Server Action untuk autentikasi masuk pengurus yayasan.
 */

import { headers } from "next/headers";
import { loginSchema } from "../schemas/login.schema";
import { authService } from "../services/auth.service";
import { twoFactorService } from "../services/two-factor.service";
import { verifyActionOrigin, sanitizeRedirectPath } from "../helpers/origin-checker";
import { getClientIp } from "../helpers/ip";
import { setSessionCookie } from "../helpers/cookies";

export interface LoginActionResult {
  success: boolean;
  error?: string | undefined;
  redirectTo?: string | undefined;
}

async function resolveRedirectPath(
  userId: string,
  next?: string,
  mustChangePassword = false
): Promise<string> {
  if (mustChangePassword) {
    return "/ganti-password";
  }

  const status = await twoFactorService.getStatus(userId);
  if (!status.enrolled) {
    return "/2fa/setup";
  }

  const nextParam = next ? `?next=${encodeURIComponent(sanitizeRedirectPath(next))}` : "";
  return `/verifikasi-2fa${nextParam}`;
}

function parseLoginInput(formData: FormData) {
  const rawInput = {
    username: formData.get("username"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  };
  return loginSchema.safeParse(rawInput);
}

export async function loginAction(
  _prevState: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  const reqHeaders = await headers();

  if (!verifyActionOrigin(reqHeaders)) {
    return { success: false, error: "Permintaan dari asal (origin) tidak sah." };
  }

  const parsed = parseLoginInput(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid.",
    };
  }

  const { username, password, next } = parsed.data;
  const ip = getClientIp(reqHeaders);
  const userAgent = reqHeaders.get("user-agent") ?? undefined;

  const result = await authService.login({ username, password, ip, userAgent });
  if (!result.success || !result.sessionToken || !result.user) {
    return { success: false, error: result.error ?? "Gagal masuk ke sistem." };
  }

  await setSessionCookie(result.sessionToken);
  const redirectTo = await resolveRedirectPath(
    result.user.id,
    next,
    result.mustChangePassword
  );

  return { success: true, redirectTo };
}
