/**
 * src/modules/auth/helpers/require-recent-reauth.ts
 * Pemeriksaan step-up re-autentikasi untuk aksi berisiko tinggi.
 */

import type { SessionWithUser } from "../repositories/session.repository";

export class ReauthRequiredError extends Error {
  constructor(
    message = "Re-autentikasi diperlukan untuk melanjutkan aksi berisiko tinggi."
  ) {
    super(message);
    this.name = "ReauthRequiredError";
  }
}

export function isReauthValid(
  reauthAt: Date | null | undefined,
  maxAgeMinutes = 15
): boolean {
  if (!reauthAt) {
    return false;
  }
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  return Date.now() - reauthAt.getTime() <= maxAgeMs;
}

export async function requireRecentReauth(
  session: SessionWithUser,
  maxAgeMinutes = 15
): Promise<void> {
  if (!isReauthValid(session.reauthAt, maxAgeMinutes)) {
    throw new ReauthRequiredError();
  }
}
