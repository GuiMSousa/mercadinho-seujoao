import { NextResponse, type NextRequest } from "next/server";
import { activityPageSchema } from "@/contracts/activity";
import { InvalidCursorError, listActivity } from "@/domains/activity/service";
import { errorResponse, guard } from "../../_lib/guard";
import { unexpectedErrorResponse } from "../../_lib/public";

const PAGE_SIZE = 50;

// ADMIN only: the shared access rule refuses CASHIER here as well as in the proxy.
export async function GET(request: NextRequest) {
  const { denial } = await guard(request);
  if (denial) return errorResponse(denial);
  try {
    const page = await listActivity({
      cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
      limit: PAGE_SIZE,
    });
    return NextResponse.json(activityPageSchema.parse(page));
  } catch (error) {
    if (error instanceof InvalidCursorError) return errorResponse(400);
    return unexpectedErrorResponse(error);
  }
}
