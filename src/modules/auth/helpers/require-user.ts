/**
 * src/modules/auth/helpers/require-user.ts
 * Helper autentikasi otoritatif sisi server untuk Server Component dan Server Actions.
 * Menegakkan 2FA TOTP wajib untuk seluruh akun (mfa_verified_at IS NOT NULL).
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME_DEV, AUTH_COOKIE_NAME_PROD } from "../constants";
import { sessionService } from "../services/session.service";
import { twoFactorRepository } from "../repositories/two-factor.repository";
import type { SessionWithUser } from "../repositories/session.repository";

export function getSessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? AUTH_COOKIE_NAME_PROD
    : AUTH_COOKIE_NAME_DEV;
}

export async function getCurrentUser(): Promise<SessionWithUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (!token) {
    return null;
  }

  return sessionService.validateSession(token);
}

export interface RequireUserOptions {
  allowMustChangePassword?: boolean;
  nextPath?: string;
  allowUnverifiedMfa?: boolean;
}

export async function requireUser(
  options: RequireUserOptions = {}
): Promise<SessionWithUser> {
  const sessionWithUser = await getCurrentUser();

  if (!sessionWithUser) {
    const nextParam = options.nextPath
      ? `?next=${encodeURIComponent(options.nextPath)}`
      : "";
    redirect(`/masuk${nextParam}`);
  }

  // 1. Verifikasi 2FA Wajib: sesi tanpa mfa_verified_at dianggap belum terautentikasi penuh
  if (!sessionWithUser.mfaVerifiedAt && !options.allowUnverifiedMfa) {
    const secretRow = await twoFactorRepository.findSecretByUserId(
      sessionWithUser.user.id
    );

    if (!secretRow || !secretRow.confirmedAt) {
      redirect("/2fa/setup");
    }
    redirect("/verifikasi-2fa");
  }

  // 2. Jika diwajibkan ganti sandi dan halaman saat ini bukan /ganti-password
  if (sessionWithUser.user.mustChangePassword && !options.allowMustChangePassword) {
    redirect("/ganti-password");
  }

  return sessionWithUser;
}
