import { NextResponse, type NextRequest } from "next/server";
import {
  productImportResultSchema,
  productImportSchema,
} from "@/contracts/product-import";
import { importProducts } from "@/domains/inventory/product-import";
import { sessionBodyRoute } from "../../../_lib/session-route";

// ADMIN only: /api/admin is an ADMIN prefix in the shared access rule.
export function POST(request: NextRequest) {
  return sessionBodyRoute(
    request,
    productImportSchema,
    async (input, session) =>
      NextResponse.json(
        productImportResultSchema.parse(
          await importProducts(session.user, input.csv),
        ),
      ),
  );
}
