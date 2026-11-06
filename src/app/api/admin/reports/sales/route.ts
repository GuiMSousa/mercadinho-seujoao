import { NextResponse, type NextRequest } from "next/server";
import { reportQuerySchema, reportSalesPageSchema } from "@/contracts/reports";
import { listReportSales } from "@/domains/reports/service";
import { sessionRoute } from "../../../_lib/session-route";
import { errorResponse } from "../../../_lib/guard";

// ADMIN only: each sale carries its CMV and margin.
export function GET(request: NextRequest) {
  return sessionRoute(request, async () => {
    const query = reportQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!query.success) return errorResponse(400);
    return NextResponse.json(
      reportSalesPageSchema.parse(await listReportSales(query.data)),
    );
  });
}
