import { NextResponse, type NextRequest } from "next/server";
import { reportQuerySchema, reportSalesPageSchema } from "@/contracts/reports";
import { listReportSales } from "@/domains/reports/service";
import { adminRoute } from "../../../_lib/admin";
import { errorResponse } from "../../../_lib/guard";

// ADMIN only: each sale carries its CMV and margin.
export function GET(request: NextRequest) {
  return adminRoute(request, async () => {
    const query = reportQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!query.success) return errorResponse(400);
    return NextResponse.json(
      reportSalesPageSchema.parse(await listReportSales(query.data)),
    );
  });
}
