import { NextResponse, type NextRequest } from "next/server";
import {
  movementsPageSchema,
  movementsQuerySchema,
} from "@/contracts/stock-history";
import { listMovements } from "@/domains/inventory/history";
import { sessionRoute } from "../../../_lib/session-route";
import { errorResponse } from "../../../_lib/guard";

// ADMIN only: /api/admin is an ADMIN prefix in the shared access rule.
export function GET(request: NextRequest) {
  return sessionRoute(request, async () => {
    const query = movementsQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!query.success) return errorResponse(400);
    return NextResponse.json(
      movementsPageSchema.parse(await listMovements(query.data)),
    );
  });
}
