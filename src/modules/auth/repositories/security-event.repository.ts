/**
 * src/modules/auth/repositories/security-event.repository.ts
 * Penyimpanan rekaman peristiwa keamanan (tabel security_events).
 * Nirubah (append-only) dan bebas dari rahasia/kata sandi.
 */

import { db } from "@/lib/db";
import type { Prisma, SecurityEvent, SecurityEventType } from "@prisma/client";

export interface RecordSecurityEventParams {
  userId?: string | null | undefined;
  ip?: string | null | undefined;
  userAgent?: string | null | undefined;
  details?: Record<string, unknown> | undefined;
}

export class SecurityEventRepository {
  async record(
    type: SecurityEventType,
    params: RecordSecurityEventParams = {}
  ): Promise<SecurityEvent> {
    const { userId = null, ip = null, userAgent = null, details = {} } = params;
    // Sanitasi ekstra: pastikan tidak ada password atau token mentah di kolom details
    const sanitizedDetails = { ...details };
    delete sanitizedDetails["password"];
    delete sanitizedDetails["newPassword"];
    delete sanitizedDetails["currentPassword"];
    delete sanitizedDetails["token"];
    delete sanitizedDetails["sessionToken"];

    return db.securityEvent.create({
      data: {
        type,
        userId: userId || null,
        ip: ip || null,
        userAgent: userAgent || null,
        details: sanitizedDetails as Prisma.InputJsonValue,
      },
    });
  }
}

export const securityEventRepository = new SecurityEventRepository();
