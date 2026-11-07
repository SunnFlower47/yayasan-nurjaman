"use server";

/**
 * src/modules/auth/actions/setup-2fa.action.ts
 * Server Action untuk konfirmasi pendaftaran 2FA TOTP awal.
 */

import { headers } from "next/headers";
import { requireUser } from "../helpers/require-user";
import { verifyActionOrigin } from "../helpers/origin-checker";
import { getClientIp } from "../helpers/ip";
import { twoFactorService } from "../services/two-factor.service";
import { sessionService } from "../services/session.service";
import { setSessionCookie } from "../helpers/cookies";

export interface Setup2FaActionResult {
  success: boolean;
  error?: string | undefined;
  recoveryCodes?: string[] | undefined;
}

export async function confirm2FaSetupAction(
  _prevState: Setup2FaActionResult | null,
  formData: FormData
): Promise<Setup2FaActionResult> {
  const reqHeaders = await headers();

  if (!verifyActionOrigin(reqHeaders)) {
    return { success: false, error: "Permintaan dari asal (origin) tidak sah." };
  }

  const sessionWithUser = await requireUser({
    allowUnverifiedMfa: true,
    allowMustChangePassword: true,
  });

  const code = formData.get("code");
  if (!code || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
    return {
      success: false,
      error: "Masukkan 6 digit kode angka dari aplikasi autentikator.",
    };
  }

  const ip = getClientIp(reqHeaders);
  const userAgent = reqHeaders.get("user-agent") || undefined;

  const result = await twoFactorService.confirmSetup(
    sessionWithUser.userId,
    code.trim(),
    ip,
    userAgent
  );

  if (!result.success || !result.recoveryCodes) {
    return { success: false, error: result.error || "Gagal mengonfirmasi kode 2FA." };
  }

  // Rotasi token sesi dan tandai mfa_verified_at = now()
  const rotated = await sessionService.rotateSession(sessionWithUser.id, true);
  await setSessionCookie(rotated.rawToken);

  return { success: true, recoveryCodes: result.recoveryCodes };
}
