/**
 * src/modules/auth/repositories/session.repository.ts
 * Akses basis data untuk manajemen siklus hidup sesi pengguna (tabel sessions).
 */

import { db } from "@/lib/db";
import type { Session, User } from "@prisma/client";

export interface CreateSessionParams {
  userId: string;
  tokenHash: string;
  ip?: string | null | undefined;
  userAgent?: string | null | undefined;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
}

export type SessionWithUser = Session & { user: User };

export class SessionRepository {
  async create(params: CreateSessionParams): Promise<Session> {
    return db.session.create({
      data: {
        userId: params.userId,
        tokenHash: params.tokenHash,
        ip: params.ip || null,
        userAgent: params.userAgent || null,
        idleExpiresAt: params.idleExpiresAt,
        absoluteExpiresAt: params.absoluteExpiresAt,
      },
    });
  }

  async findActiveByTokenHash(tokenHash: string): Promise<SessionWithUser | null> {
    return db.session.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
      },
      include: {
        user: true,
      },
    });
  }

  async updateActivity(sessionId: string, newIdleExpiresAt: Date): Promise<void> {
    await db.session.update({
      where: { id: sessionId },
      data: {
        lastSeenAt: new Date(),
        idleExpiresAt: newIdleExpiresAt,
      },
    });
  }

  async revoke(sessionId: string, reason: string): Promise<void> {
    await db.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
  }

  async revokeOtherSessions(
    userId: string,
    currentSessionId: string,
    reason: string
  ): Promise<number> {
    const result = await db.session.updateMany({
      where: {
        userId,
        id: { not: currentSessionId },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
    return result.count;
  }
}

export const sessionRepository = new SessionRepository();
