import { NextResponse, type NextRequest } from "next/server";
import { createSaleSchema, saleReceiptSchema } from "@/contracts/sales";
import { registerSale } from "@/domains/sales/service";
import { adminBodyRoute } from "../_lib/admin";

// Open to any session (ADMIN and CASHIER sell): the guard only restricts the ADMIN prefixes.
export function POST(request: NextRequest) {
  return adminBodyRoute(request, createSaleSchema, async (input, session) =>
    NextResponse.json(
      saleReceiptSchema.parse(await registerSale(session.user, input)),
      { status: 201 },
    ),
  );
}
