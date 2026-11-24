import { NextResponse, type NextRequest } from "next/server";
import {
  adjustStockSchema,
  consumeStockResponseSchema,
} from "@/contracts/inventory";
import { adjustStock } from "@/domains/inventory/service";
import { sessionBodyRoute } from "../../../_lib/session-route";

// ADMIN only: /api/admin is an ADMIN prefix in the shared access rule.
export function POST(request: NextRequest) {
  return sessionBodyRoute(request, adjustStockSchema, async (input, session) =>
    NextResponse.json(
      consumeStockResponseSchema.parse({
        allocations: await adjustStock({ ...input, userId: session.user.id }),
      }),
    ),
  );
}
