/**
 * src/modules/auth/repositories/rate-limit.repository.ts
 * Penyimpanan pelacak laju percobaan (rate limit) persisten pada PostgreSQL.
 */

import { db } from "@/lib/db";
import type { RateLimitCounter } from "@prisma/client";

export class RateLimitRepository {
  async findActiveBlocked(key: string): Promise<RateLimitCounter | null> {
    const now = new Date();
    return db.rateLimitCounter.findFirst({
      where: {
        key,
        blockedUntil: {
          gt: now,
        },
      },
      orderBy: {
        blockedUntil: "desc",
      },
    });
  }

  async increment(
    key: string,
    windowStart: Date,
    blockedUntil: Date | null = null
  ): Promise<RateLimitCounter> {
    return db.rateLimitCounter.upsert({
      where: {
        key_windowStart: {
          key,
          windowStart,
        },
      },
      create: {
        key,
        windowStart,
        hitCount: 1,
        blockedUntil,
      },
      update: {
        hitCount: { increment: 1 },
        ...(blockedUntil ? { blockedUntil } : {}),
      },
    });
  }

  async reset(key: string): Promise<void> {
    await db.rateLimitCounter.deleteMany({
      where: { key },
    });
  }
}

export const rateLimitRepository = new RateLimitRepository();
