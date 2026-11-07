/**
 * src/modules/auth/services/session.service.ts
 * Layanan validasi, perpanjangan idle, batas absolut, rotasi, dan pencabutan sesi.
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

  async validateSession(rawToken: string): Promise<SessionWithUser | null> {
    const tokenHash = hashSessionToken(rawToken);
    const session = await sessionRepository.findActiveByTokenHash(tokenHash);

    if (!session || !session.user) {
      return null;
    }

    if (session.user.status !== "ACTIVE" || session.user.deletedAt !== null) {
      await sessionRepository.revoke(session.id, "USER_INACTIVE");
      return null;
    }

    const now = Date.now();

    if (now > session.absoluteExpiresAt.getTime()) {
      await sessionRepository.revoke(session.id, "ABSOLUTE_TIMEOUT");
      return null;
    }

    if (now > session.idleExpiresAt.getTime()) {
      await sessionRepository.revoke(session.id, "IDLE_TIMEOUT");
      return null;
    }

    if (now - session.lastSeenAt.getTime() >= SESSION_ACTIVITY_THROTTLE_MS) {
      const newIdleExpiresAt = new Date(now + SESSION_IDLE_TIMEOUT_MS);
      await sessionRepository.updateActivity(session.id, newIdleExpiresAt);
      session.lastSeenAt = new Date(now);
      session.idleExpiresAt = newIdleExpiresAt;
    }

    return session;
  }

  async rotateSession(
    sessionId: string,
    mfaVerified = true
  ): Promise<{ rawToken: string }> {
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    await sessionRepository.rotateToken(sessionId, tokenHash, mfaVerified);
    return { rawToken };
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

  async revokeAllUserSessions(userId: string, reason = "RESET_2FA"): Promise<number> {
    return sessionRepository.revokeAllSessions(userId, reason);
  }
}

export const sessionService = new SessionService();
