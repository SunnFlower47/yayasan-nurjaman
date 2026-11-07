"use server";

/**
 * src/modules/auth/actions/regenerate-recovery.action.ts
 * Server Action untuk membuat ulang 10 kode cadangan pemulihan 2FA.
 */

import { headers } from "next/headers";
import { requireUser } from "../helpers/require-user";
import { requireRecentReauth } from "../helpers/require-recent-reauth";
import { verifyActionOrigin } from "../helpers/origin-checker";
import { getClientIp } from "../helpers/ip";
import { twoFactorService } from "../services/two-factor.service";

export interface RegenerateRecoveryActionResult {
  success: boolean;
  error?: string | undefined;
  recoveryCodes?: string[] | undefined;
}

export async function regenerateRecoveryAction(): Promise<RegenerateRecoveryActionResult> {
  const reqHeaders = await headers();

  if (!verifyActionOrigin(reqHeaders)) {
    return { success: false, error: "Permintaan dari asal (origin) tidak sah." };
  }

  const sessionWithUser = await requireUser();

  try {
    await requireRecentReauth(sessionWithUser, 15);
  } catch {
    return {
      success: false,
      error:
        "Sesi re-autentikasi Anda telah berakhir (15 menit). Harap masukkan sandi atau kode TOTP ulang sebelum membuat kode baru.",
    };
  }

  const ip = getClientIp(reqHeaders);
  const userAgent = reqHeaders.get("user-agent") || undefined;

  const recoveryCodes = await twoFactorService.regenerateRecovery(
    sessionWithUser.userId,
    ip,
    userAgent
  );

  return { success: true, recoveryCodes };
}
