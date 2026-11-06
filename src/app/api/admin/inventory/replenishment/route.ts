import { NextResponse, type NextRequest } from "next/server";
import { replenishmentSchema } from "@/contracts/suppliers";
import { getReplenishment } from "@/domains/suppliers/service";
import { sessionRoute } from "../../../_lib/session-route";

// ADMIN only: /api/admin is an ADMIN prefix in the shared access rule.
export function GET(request: NextRequest) {
  return sessionRoute(request, async () =>
    NextResponse.json(replenishmentSchema.parse(await getReplenishment())),
  );
}
