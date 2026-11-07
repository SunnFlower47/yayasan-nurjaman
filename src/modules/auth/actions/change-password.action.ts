"use server";

/**
 * src/modules/auth/actions/change-password.action.ts
 * Server Action untuk alur penggantian kata sandi (wajib maupun berkala).
 */

import { headers } from "next/headers";
import { changePasswordSchema } from "../schemas/change-password.schema";
import { authService } from "../services/auth.service";
import { twoFactorService } from "../services/two-factor.service";
import { verifyActionOrigin } from "../helpers/origin-checker";
import { getClientIp } from "../helpers/ip";
import { requireUser } from "../helpers/require-user";

export interface ChangePasswordActionResult {
  success: boolean;
  error?: string | undefined;
  redirectTo?: string | undefined;
}

export async function changePasswordAction(
  _prevState: ChangePasswordActionResult | null,
  formData: FormData
): Promise<ChangePasswordActionResult> {
  const reqHeaders = await headers();

  // 1. Verifikasi CSRF / Origin
  if (!verifyActionOrigin(reqHeaders)) {
    return { success: false, error: "Permintaan dari asal (origin) tidak sah." };
  }

  // 2. Otorisasi Pengguna (diizinkan saat mustChangePassword atau sebelum 2FA selesai)
  const sessionWithUser = await requireUser({
    allowMustChangePassword: true,
    allowUnverifiedMfa: true,
  });

  // 3. Validasi skema input form
  const rawInput = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = changePasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Input tidak valid.";
    return { success: false, error: firstError };
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data;
  const ip = getClientIp(reqHeaders);
  const userAgent = reqHeaders.get("user-agent") || undefined;

  // 4. Eksekusi ganti kata sandi
  const result = await authService.changePassword({
    userId: sessionWithUser.userId,
    currentSessionId: sessionWithUser.id,
    currentPassword,
    newPassword,
    confirmPassword,
    userIp: ip,
    userAgent,
  });

  if (!result.success) {
    return { success: false, error: result.error || "Gagal mengubah kata sandi." };
  }

  const status = await twoFactorService.getStatus(sessionWithUser.userId);
  const redirectTo = !status.enrolled ? "/2fa/setup" : "/admin";

  return { success: true, redirectTo };
}
