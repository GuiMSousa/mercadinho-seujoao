import { NextResponse, type NextRequest } from "next/server";
import { barcodeSchema, productLookupSchema } from "@/contracts/inventory";
import { findProductForSale } from "@/domains/inventory/service";
import { adminRoute } from "../_lib/admin";
import { errorResponse } from "../_lib/guard";

// Open to any session: the guard only restricts the ADMIN prefixes, and this path is not one.
export function GET(request: NextRequest) {
  return adminRoute(request, async () => {
    const barcode = barcodeSchema.safeParse(
      request.nextUrl.searchParams.get("barcode"),
    );
    if (!barcode.success) return errorResponse(400);
    return NextResponse.json(
      productLookupSchema.parse(await findProductForSale(barcode.data)),
    );
  });
}
