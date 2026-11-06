import { NextResponse, type NextRequest } from "next/server";
import { customerOptionsSchema } from "@/contracts/customers";
import { listQuerySchema } from "@/contracts/inventory";
import { findCustomerOptions } from "@/domains/customers/service";
import { sessionRoute } from "../_lib/session-route";
import { errorResponse } from "../_lib/guard";

// Open to any session: the sale screen picks the fiado customer here. No document in the answer.
export function GET(request: NextRequest) {
  return sessionRoute(request, async () => {
    const query = listQuerySchema.safeParse({
      search: request.nextUrl.searchParams.get("search") ?? "",
    });
    if (!query.success) return errorResponse(400);
    return NextResponse.json(
      customerOptionsSchema.parse(await findCustomerOptions(query.data.search)),
    );
  });
}
