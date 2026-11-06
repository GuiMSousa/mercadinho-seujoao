import { NextResponse, type NextRequest } from "next/server";
import { inventoryPageSchema, listQuerySchema } from "@/contracts/inventory";
import { listInventory } from "@/domains/inventory/service";
import { sessionRoute } from "../../_lib/session-route";
import { errorResponse } from "../../_lib/guard";

export function GET(request: NextRequest) {
  return sessionRoute(request, async () => {
    const query = listQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!query.success) return errorResponse(400);
    return NextResponse.json(
      inventoryPageSchema.parse(await listInventory(query.data)),
    );
  });
}
