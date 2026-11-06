import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

export const db = getPrismaClient();

/**
 * Memeriksa status konektivitas basis data PostgreSQL via Prisma Client (SELECT 1).
 * Menggunakan kredensial koneksi DATABASE_URL yang terpasang pada role db_app.
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  latencyMs: number | null;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;

    return {
      connected: true,
      latencyMs: Date.now() - startTime,
    };
  } catch (err) {
    return {
      connected: false,
      latencyMs: null,
      error:
        err instanceof Error ? err.message : "Gagal terhubung ke PostgreSQL via Prisma",
    };
  }
}
