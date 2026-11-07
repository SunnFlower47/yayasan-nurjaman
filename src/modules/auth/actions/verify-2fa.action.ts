"use server";

/**
 * src/modules/auth/actions/verify-2fa.action.ts
 * Server Action untuk verifikasi tantangan 2FA (TOTP 6-digit atau Recovery Code).
 */

import { headers } from "next/headers";
import { getCurrentUser } from "../helpers/require-user";
import { verifyActionOrigin, sanitizeRedirectPath } from "../helpers/origin-checker";
import { getClientIp } from "../helpers/ip";
import { twoFactorService } from "../services/two-factor.service";
import { sessionService } from "../services/session.service";
import { rateLimitService } from "../services/rate-limit.service";
import { setSessionCookie, clearSessionCookie } from "../helpers/cookies";

export interface Verify2FaActionResult {
  success: boolean;
  error?: string | undefined;
  redirectTo?: string | undefined;
}

interface VerifyCredsParams {
  userId: string;
  code: string;
  useRecovery: boolean;
  ip: string;
  userAgent?: string | undefined;
}

async function verifyCredentials(
  params: VerifyCredsParams
): Promise<{ valid: boolean; error: string }> {
  const { userId, code, useRecovery, ip, userAgent } = params;
  if (useRecovery || code.includes("-")) {
    const recResult = await twoFactorService.verifyRecovery(userId, code, ip, userAgent);
    return {
      valid: recResult.valid,
      error: recResult.error ?? "Kode pemulihan tidak valid.",
    };
  }

  const totpResult = await twoFactorService.verifyCode(userId, code, ip, userAgent);
  return { valid: totpResult.valid, error: totpResult.error ?? "Kode TOTP tidak valid." };
}

async function handleMfaFailure(
  sessionId: string,
  verifyError: string
): Promise<Verify2FaActionResult> {
  const rateCheck = await rateLimitService.recordMfaFailure(sessionId);
  if (rateCheck.lockedOut) {
    await sessionService.revokeSession(sessionId, "MFA_5_CONSECUTIVE_FAILURES_LOCKOUT");
    await clearSessionCookie();
    return {
      success: false,
      error:
        "Terlalu banyak percobaan kode verifikasi yang salah (5 kali). Sesi Anda telah dicabut demi keamanan. Silakan login kembali.",
    };
  }
  return { success: false, error: verifyError };
}

export async function verify2FaAction(
  _prevState: Verify2FaActionResult | null,
  formData: FormData
): Promise<Verify2FaActionResult> {
  const reqHeaders = await headers();

  if (!verifyActionOrigin(reqHeaders)) {
    return { success: false, error: "Permintaan dari asal (origin) tidak sah." };
  }

  const sessionWithUser = await getCurrentUser();
  if (!sessionWithUser) {
    return { success: false, error: "Sesi tidak ditemukan atau telah kedaluwarsa." };
  }

  if (sessionWithUser.mfaVerifiedAt !== null) {
    return { success: true, redirectTo: "/admin" };
  }

  const rawCode = formData.get("code");
  const useRecovery = formData.get("useRecovery") === "true";
  const next = formData.get("next");

  if (!rawCode || typeof rawCode !== "string" || !rawCode.trim()) {
    return { success: false, error: "Masukkan kode verifikasi." };
  }

  const code = rawCode.trim();
  const ip = getClientIp(reqHeaders);
  const userAgent = reqHeaders.get("user-agent") ?? undefined;

  const { valid, error } = await verifyCredentials({
    userId: sessionWithUser.userId,
    code,
    useRecovery,
    ip,
    userAgent,
  });

  if (!valid) {
    return handleMfaFailure(sessionWithUser.id, error);
  }

  await rateLimitService.resetMfaFailure(sessionWithUser.id);
  const rotated = await sessionService.rotateSession(sessionWithUser.id, true);
  await setSessionCookie(rotated.rawToken);

  const redirectTo = sanitizeRedirectPath(typeof next === "string" ? next : "/admin");

  return { success: true, redirectTo };
}
