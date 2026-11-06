import { NextResponse, type NextRequest } from "next/server";
import {
  customerRowSchema,
  customerStatementSchema,
  updateCustomerSchema,
} from "@/contracts/customers";
import { listQuerySchema } from "@/contracts/inventory";
import { getStatement, updateCustomer } from "@/domains/customers/service";
import { sessionBodyRoute, sessionRoute } from "../../../_lib/session-route";
import { errorResponse } from "../../../_lib/guard";
import { customerId, type CustomerContext as Context } from "../customer-id";

/** The statement: the customer and one page of purchases on account and payments, newest first. */
export function GET(request: NextRequest, context: Context) {
  return sessionRoute(request, async () => {
    const query = listQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!query.success) return errorResponse(400);
    return NextResponse.json(
      customerStatementSchema.parse(
        await getStatement(await customerId(context), query.data.page),
      ),
    );
  });
}

export function PATCH(request: NextRequest, context: Context) {
  return sessionBodyRoute(
    request,
    updateCustomerSchema,
    async (input, session) =>
      NextResponse.json(
        customerRowSchema.parse(
          await updateCustomer(session.user, await customerId(context), input),
        ),
      ),
  );
}
