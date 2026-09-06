import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "ok";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (err: any) {
    dbStatus = "error";
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === "ok";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      service: "esnafca",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      port: 3005,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      telemetry: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        responseTimeMs,
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}
