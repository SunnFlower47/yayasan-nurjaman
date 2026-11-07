/**
 * src/modules/auth/helpers/require-user.ts
 * Helper autentikasi otoritatif sisi server untuk Server Component dan Server Actions.
 * Mengacu pada ADR-004 (otorisasi server, bukan murni middleware).
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME_DEV, AUTH_COOKIE_NAME_PROD } from "../constants";
import { sessionService } from "../services/session.service";
import type { SessionWithUser } from "../repositories/session.repository";

export function getSessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? AUTH_COOKIE_NAME_PROD
    : AUTH_COOKIE_NAME_DEV;
}

/**
 * Mengambil sesi dan pengguna saat ini dari cookie tanpa pengalihan otomatis.
 * Mengembalikan null jika pengguna belum terautentikasi atau sesi kedaluwarsa.
 */
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
}

/**
 * Memastikan permintaan memiliki sesi aktif yang sah.
 * Mengalihkan secara otomatis ke /masuk jika tidak sah,
 * atau ke /ganti-password jika must_change_password bernilai true.
 */
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

  // Jika diwajibkan ganti sandi dan halaman saat ini bukan /ganti-password
  if (sessionWithUser.user.mustChangePassword && !options.allowMustChangePassword) {
    redirect("/ganti-password");
  }

  return sessionWithUser;
}
