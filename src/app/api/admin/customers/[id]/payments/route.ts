import { NextResponse, type NextRequest } from "next/server";
import {
  customerPaymentResultSchema,
  customerPaymentSchema,
} from "@/contracts/customers";
import { receivePayment } from "@/domains/customers/service";
import { sessionBodyRoute } from "../../../../_lib/session-route";
import { customerId, type CustomerContext } from "../../customer-id";

/** Quitação: a payment towards the customer's debt, total or partial. */
export function POST(request: NextRequest, context: CustomerContext) {
  return sessionBodyRoute(
    request,
    customerPaymentSchema,
    async (input, session) =>
      NextResponse.json(
        customerPaymentResultSchema.parse(
          await receivePayment(session.user, await customerId(context), input),
        ),
        { status: 201 },
      ),
  );
}
