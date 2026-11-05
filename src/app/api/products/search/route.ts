import { NextResponse, type NextRequest } from "next/server";
import {
  productSearchResponseSchema,
  productSearchSchema,
} from "@/contracts/inventory";
import { searchProductsForSale } from "@/domains/inventory/service";
import { adminRoute } from "../../_lib/admin";
import { errorResponse } from "../../_lib/guard";

// Open to any session: the guard only restricts the ADMIN prefixes, and this path is not one.
export function GET(request: NextRequest) {
  return adminRoute(request, async () => {
    const query = productSearchSchema.safeParse({
      q: request.nextUrl.searchParams.get("q") ?? "",
    });
    if (!query.success) return errorResponse(400);
    return NextResponse.json(
      productSearchResponseSchema.parse({
        products: await searchProductsForSale(query.data.q),
      }),
    );
  });
}
