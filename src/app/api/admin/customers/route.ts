import { NextResponse, type NextRequest } from "next/server";
import {
  createCustomerSchema,
  customerRowSchema,
  customersPageSchema,
} from "@/contracts/customers";
import { listQuerySchema } from "@/contracts/inventory";
import { createCustomer, listCustomers } from "@/domains/customers/service";
import { sessionBodyRoute, sessionRoute } from "../../_lib/session-route";
import { errorResponse } from "../../_lib/guard";

// ADMIN only: /api/admin is an ADMIN prefix in the shared access rule.
export function GET(request: NextRequest) {
  return sessionRoute(request, async () => {
    const query = listQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!query.success) return errorResponse(400);
    return NextResponse.json(
      customersPageSchema.parse(await listCustomers(query.data)),
    );
  });
}

export function POST(request: NextRequest) {
  return sessionBodyRoute(
    request,
    createCustomerSchema,
    async (input, session) =>
      NextResponse.json(
        customerRowSchema.parse(await createCustomer(session.user, input)),
        { status: 201 },
      ),
  );
}
