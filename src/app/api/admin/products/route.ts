import { NextResponse, type NextRequest } from "next/server";
import {
  createProductSchema,
  productRowSchema,
  productsListResponseSchema,
} from "@/contracts/inventory";
import { createProduct, listProducts } from "@/domains/inventory/service";
import { adminBodyRoute, adminRoute } from "../../_lib/admin";

export function GET(request: NextRequest) {
  return adminRoute(request, async () =>
    NextResponse.json(
      productsListResponseSchema.parse({ products: await listProducts() }),
    ),
  );
}

export function POST(request: NextRequest) {
  return adminBodyRoute(request, createProductSchema, async (input, session) =>
    NextResponse.json(
      productRowSchema.parse(await createProduct(session.user, input)),
      { status: 201 },
    ),
  );
}
