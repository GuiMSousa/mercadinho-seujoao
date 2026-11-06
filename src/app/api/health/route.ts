import { NextResponse } from "next/server";
import { healthSchema } from "@/contracts/health";
import { pingDatabase } from "@/infrastructure/db";
import { logger } from "@/lib/logger";

// Public (Docker healthcheck, uptime monitors): only whether the app reaches its database.
export async function GET() {
  const timestamp = new Date().toISOString();
  const headers = { "Cache-Control": "no-store" };
  try {
    await pingDatabase();
    return NextResponse.json(
      healthSchema.parse({ status: "ok", timestamp, db: "connected" }),
      { headers },
    );
  } catch (error) {
    // The reason stays in the log; a public answer must not describe the database. Drizzle wraps
    // the driver's error; its code and message (host and port, never the password) are the cause's.
    const cause = ((error as { cause?: unknown }).cause ??
      error) as NodeJS.ErrnoException;
    logger.error(
      { code: cause.code, reason: cause.message },
      "Health check: database unreachable",
    );
    return NextResponse.json(
      healthSchema.parse({ status: "error", timestamp, db: "disconnected" }),
      { status: 503, headers },
    );
  }
}
