import { NextResponse, type NextRequest } from "next/server";
import { cashPageQuerySchema, cashSessionsPageSchema } from "@/contracts/cash";
import { listCashSessions } from "@/domains/cash/service";
import { sessionRoute } from "../../_lib/session-route";
import { errorResponse } from "../../_lib/guard";

// ADMIN only: the reconciliation (expected amount and difference) the counter never sees.
export function GET(request: NextRequest) {
  return sessionRoute(request, async () => {
    const query = cashPageQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!query.success) return errorResponse(400);
    return NextResponse.json(
      cashSessionsPageSchema.parse(await listCashSessions(query.data)),
    );
  });
}
