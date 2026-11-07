/**
 * src/modules/auth/helpers/require-partial-session.ts
 * Helper sesi parsial untuk alur setup 2FA, verifikasi 2FA, dan ganti sandi wajib.
 * Menolak akses langsung bagi pengguna yang telah terautentikasi penuh (mfa_verified_at != null).
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "./require-user";
import type { SessionWithUser } from "../repositories/session.repository";

export interface RequirePartialSessionOptions {
  allowFullSession?: boolean;
}

export async function requirePartialSession(
  options: RequirePartialSessionOptions = {}
): Promise<SessionWithUser> {
  const sessionWithUser = await getCurrentUser();

  if (!sessionWithUser) {
    redirect("/masuk");
  }

  // Jika sesi sudah terverifikasi penuh dan rute tidak mengizinkan sesi penuh, arahkan ke /admin
  if (sessionWithUser.mfaVerifiedAt !== null && !options.allowFullSession) {
    if (sessionWithUser.user.mustChangePassword) {
      redirect("/ganti-password");
    }
    redirect("/admin");
  }

  return sessionWithUser;
}
