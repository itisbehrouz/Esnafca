import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const isAdmin = await getAdminSessionFromRequest(request);
  if (!isAdmin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      let intervalId: NodeJS.Timeout | null = null;
      let lastPendingCount = 0;

      // Function to send event
      const sendEvent = (event: string, data: any) => {
        if (isClosed) return;
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          isClosed = true;
          if (intervalId) clearInterval(intervalId);
        }
      };

      // Initial telemetry payload
      try {
        const [pendingCount, totalMerchants, recentLogs] = await Promise.all([
          prisma.merchantApplication.count({ where: { status: "pending" } }),
          prisma.merchant.count(),
          prisma.adminAuditLog.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
          }),
        ]);

        lastPendingCount = pendingCount;

        sendEvent("init", {
          pendingCount,
          totalMerchants,
          recentLogs,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("SSE initial data error:", err);
      }

      // Heartbeat and state change polling every 8 seconds
      intervalId = setInterval(async () => {
        if (isClosed) {
          if (intervalId) clearInterval(intervalId);
          return;
        }

        try {
          const [pendingCount, totalMerchants] = await Promise.all([
            prisma.merchantApplication.count({ where: { status: "pending" } }),
            prisma.merchant.count(),
          ]);

          // Emit alert if new applications arrived
          if (pendingCount > lastPendingCount) {
            sendEvent("new_application", {
              newCount: pendingCount - lastPendingCount,
              totalPending: pendingCount,
              timestamp: new Date().toISOString(),
            });
          }
          lastPendingCount = pendingCount;

          sendEvent("pulse", {
            pendingCount,
            totalMerchants,
            timestamp: new Date().toISOString(),
          });
        } catch {
          // Keep stream alive
        }
      }, 8000);

      // Clean up when request closes or client disconnects
      request.signal.addEventListener("abort", () => {
        isClosed = true;
        if (intervalId) clearInterval(intervalId);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
