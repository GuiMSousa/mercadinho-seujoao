import { NextResponse, type NextRequest } from "next/server";
import {
  createProductSchema,
  listQuerySchema,
  productRowSchema,
  productsPageSchema,
} from "@/contracts/inventory";
import { createProduct, listProducts } from "@/domains/inventory/service";
import { adminBodyRoute, adminRoute } from "../../_lib/admin";
import { errorResponse } from "../../_lib/guard";

export function GET(request: NextRequest) {
  return adminRoute(request, async () => {
    const query = listQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!query.success) return errorResponse(400);
    return NextResponse.json(
      productsPageSchema.parse(await listProducts(query.data)),
    );
  });
}

export function POST(request: NextRequest) {
  return adminBodyRoute(request, createProductSchema, async (input, session) =>
    NextResponse.json(
      productRowSchema.parse(await createProduct(session.user, input)),
      { status: 201 },
    ),
  );
}
