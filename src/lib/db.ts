import { PrismaClient } from "@prisma/client";
import net from "node:net";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getPrismaClient(): PrismaClient | null {
  try {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({
        log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      });
    }
    return globalForPrisma.prisma;
  } catch {
    return null;
  }
}

/**
 * Memeriksa status konektivitas basis data PostgreSQL.
 * Mencoba via PrismaClient.$queryRawUnsafe("SELECT 1").
 * Jika PrismaClient belum digenerate (karena schema.prisma belum memiliki model domain di Fase 0),
 * sistem memverifikasi ketersediaan server PostgreSQL via soket TCP pada host:port konfigurasi DATABASE_URL.
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  latencyMs: number | null;
  error?: string;
}> {
  const startTime = Date.now();

  // 1. Coba kueri melalui Prisma Client jika tersedia
  try {
    const prisma = getPrismaClient();
    if (prisma && typeof prisma.$queryRawUnsafe === "function") {
      await prisma.$queryRawUnsafe("SELECT 1");
      return {
        connected: true,
        latencyMs: Date.now() - startTime,
      };
    }
  } catch {
    // Lanjut ke fallback TCP probe
  }

  // 2. Fallback TCP probe ke database PostgreSQL (Fase 0)
  try {
    const parsedUrl = new URL(env.DATABASE_URL.replace(/^postgresql:/i, "http:"));
    const host = parsedUrl.hostname || "127.0.0.1";
    const port = Number(parsedUrl.port) || 5432;

    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection({ host, port }, () => {
        socket.end();
        resolve();
      });
      socket.setTimeout(2000, () => {
        socket.destroy();
        reject(new Error("Database connection timeout (2000ms)"));
      });
      socket.on("error", (err) => {
        socket.destroy();
        reject(err);
      });
    });

    return {
      connected: true,
      latencyMs: Date.now() - startTime,
    };
  } catch (err) {
    return {
      connected: false,
      latencyMs: null,
      error: err instanceof Error ? err.message : "Gagal terhubung ke PostgreSQL",
    };
  }
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (!client) {
      throw new Error(
        "PrismaClient belum dapat digunakan karena skema belum memiliki model domain. Model akan dimigrasikan pada Fase 1."
      );
    }
    return (client as unknown as Record<string, unknown>)[prop as string];
  },
});
