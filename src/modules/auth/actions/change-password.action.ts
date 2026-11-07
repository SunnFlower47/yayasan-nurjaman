"use server";

/**
 * src/modules/auth/actions/change-password.action.ts
 * Server Action untuk pembaruan kata sandi wajib dan berkala.
 */

import { headers } from "next/headers";
import { changePasswordSchema } from "../schemas/change-password.schema";
import { authService } from "../services/auth.service";
import { verifyActionOrigin } from "../helpers/origin-checker";
import { requireUser } from "../helpers/require-user";
import { getClientIp } from "../helpers/ip";

export interface ChangePasswordActionResult {
  success: boolean;
  error?: string | undefined;
}

export async function changePasswordAction(
  _prevState: ChangePasswordActionResult | null,
  formData: FormData
): Promise<ChangePasswordActionResult> {
  const reqHeaders = await headers();

  // 1. Verifikasi Origin
  if (!verifyActionOrigin(reqHeaders)) {
    return { success: false, error: "Permintaan dari asal (origin) tidak sah." };
  }

  // 2. Otorisasi Pengguna (diizinkan bila sedang berstatus mustChangePassword)
  const sessionWithUser = await requireUser({ allowMustChangePassword: true });

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
  const requestId = reqHeaders.get("x-request-id") || undefined;

  // 4. Eksekusi ganti kata sandi
  const result = await authService.changePassword({
    userId: sessionWithUser.userId,
    currentSessionId: sessionWithUser.id,
    currentPassword,
    newPassword,
    confirmPassword,
    userIp: ip,
    userAgent,
    requestId,
  });

  return result;
}
