import { NextResponse, type NextRequest } from "next/server";
import {
  categoriesListResponseSchema,
  categoryRowSchema,
  createCategorySchema,
} from "@/contracts/inventory";
import { createCategory, listCategories } from "@/domains/inventory/service";
import { adminBodyRoute, adminRoute } from "../../_lib/admin";

export function GET(request: NextRequest) {
  return adminRoute(request, async () =>
    NextResponse.json(
      categoriesListResponseSchema.parse({
        categories: await listCategories(),
      }),
    ),
  );
}

export function POST(request: NextRequest) {
  return adminBodyRoute(request, createCategorySchema, async (input, session) =>
    NextResponse.json(
      categoryRowSchema.parse(await createCategory(session.user, input)),
      { status: 201 },
    ),
  );
}
