/**
 * src/modules/auth/services/session.service.ts
 * Layanan validasi, perpanjangan idle, batas absolut, dan pencabutan sesi.
 */

import {
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_ACTIVITY_THROTTLE_MS,
} from "../constants";
import { generateSessionToken, hashSessionToken } from "../helpers/token";
import {
  sessionRepository,
  type SessionWithUser,
} from "../repositories/session.repository";
import type { Session } from "@prisma/client";

export class SessionService {
  /**
   * Membuat sesi baru dengan token kriptografis berentropi 256-bit.
   */
  async createSession(
    userId: string,
    ip?: string,
    userAgent?: string
  ): Promise<{ rawToken: string; session: Session }> {
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);

    const now = Date.now();
    const idleExpiresAt = new Date(now + SESSION_IDLE_TIMEOUT_MS);
    const absoluteExpiresAt = new Date(now + SESSION_ABSOLUTE_TIMEOUT_MS);

    const session = await sessionRepository.create({
      userId,
      tokenHash,
      ip,
      userAgent,
      idleExpiresAt,
      absoluteExpiresAt,
    });

    return { rawToken, session };
  }

  /**
   * Memvalidasi keabsahan token sesi, memeriksa kedaluwarsa idle & absolut,
   * serta memperpanjang idle timeout maksimal 1x per menit.
   */
  async validateSession(rawToken: string): Promise<SessionWithUser | null> {
    const tokenHash = hashSessionToken(rawToken);
    const session = await sessionRepository.findActiveByTokenHash(tokenHash);

    if (!session || !session.user) {
      return null;
    }

    // Pastikan akun aktif dan tidak di-soft-delete
    if (session.user.status !== "ACTIVE" || session.user.deletedAt !== null) {
      await sessionRepository.revoke(session.id, "USER_INACTIVE");
      return null;
    }

    const now = Date.now();

    // 1. Periksa batas absolut 8 jam (tidak dapat diperpanjang)
    if (now > session.absoluteExpiresAt.getTime()) {
      await sessionRepository.revoke(session.id, "ABSOLUTE_TIMEOUT");
      return null;
    }

    // 2. Periksa batas diam (idle) 30 menit
    if (now > session.idleExpiresAt.getTime()) {
      await sessionRepository.revoke(session.id, "IDLE_TIMEOUT");
      return null;
    }

    // 3. Perpanjang idle timeout jika aktivitas terakhir melebihi throttle interval (1 menit)
    if (now - session.lastSeenAt.getTime() >= SESSION_ACTIVITY_THROTTLE_MS) {
      const newIdleExpiresAt = new Date(now + SESSION_IDLE_TIMEOUT_MS);
      await sessionRepository.updateActivity(session.id, newIdleExpiresAt);
      session.lastSeenAt = new Date(now);
      session.idleExpiresAt = newIdleExpiresAt;
    }

    return session;
  }

  async revokeSession(sessionId: string, reason = "LOGOUT"): Promise<void> {
    await sessionRepository.revoke(sessionId, reason);
  }

  async revokeOtherSessions(
    userId: string,
    currentSessionId: string,
    reason = "PASSWORD_CHANGED"
  ): Promise<number> {
    return sessionRepository.revokeOtherSessions(userId, currentSessionId, reason);
  }
}

export const sessionService = new SessionService();
