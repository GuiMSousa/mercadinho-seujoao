import { NextResponse, type NextRequest } from "next/server";
import {
  consumeStockResponseSchema,
  consumeStockSchema,
} from "@/contracts/inventory";
import { consumeStock } from "@/domains/inventory/service";
import { sessionBodyRoute } from "../../../_lib/session-route";

export function POST(request: NextRequest) {
  return sessionBodyRoute(request, consumeStockSchema, async (input, session) =>
    NextResponse.json(
      consumeStockResponseSchema.parse({
        allocations: await consumeStock({
          ...input,
          userId: session.user.id,
        }),
      }),
    ),
  );
}
