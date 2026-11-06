import { NextResponse, type NextRequest } from "next/server";
import { stockAlertsSchema } from "@/contracts/suppliers";
import { countStockAlerts } from "@/domains/suppliers/service";
import { sessionRoute } from "../../../_lib/session-route";

// ADMIN only: /api/admin is an ADMIN prefix in the shared access rule.
export function GET(request: NextRequest) {
  return sessionRoute(request, async () =>
    NextResponse.json(
      stockAlertsSchema.parse({ count: await countStockAlerts() }),
    ),
  );
}
