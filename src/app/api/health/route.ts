import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const dbHealth = await checkDatabaseConnection();

  const isHealthy = dbHealth.connected;

  const responseBody = {
    status: isHealthy ? "ok" : "degraded",
    service: "yayasan-nurjaman-api",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbHealth.connected ? "connected" : "disconnected",
      latencyMs: dbHealth.latencyMs,
      ...(dbHealth.error && { error: dbHealth.error }),
    },
    totalResponseTimeMs: Date.now() - startTime,
  };

  return NextResponse.json(responseBody, {
    status: isHealthy ? 200 : 503,
  });
}
