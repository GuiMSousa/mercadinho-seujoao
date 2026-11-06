import { NextResponse, type NextRequest } from "next/server";
import { financialReportSchema, reportQuerySchema } from "@/contracts/reports";
import { getFinancialReport } from "@/domains/reports/service";
import { sessionRoute } from "../../_lib/session-route";
import { errorResponse } from "../../_lib/guard";

// ADMIN only: revenue, CMV and margins never reach a CASHIER.
export function GET(request: NextRequest) {
  return sessionRoute(request, async () => {
    const query = reportQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!query.success) return errorResponse(400);
    return NextResponse.json(
      financialReportSchema.parse(await getFinancialReport(query.data)),
    );
  });
}
