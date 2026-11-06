import { NextResponse, type NextRequest } from "next/server";
import {
  categoriesListResponseSchema,
  categoryRowSchema,
  createCategorySchema,
} from "@/contracts/inventory";
import { createCategory, listCategories } from "@/domains/inventory/service";
import { sessionBodyRoute, sessionRoute } from "../../_lib/session-route";

export function GET(request: NextRequest) {
  return sessionRoute(request, async () =>
    NextResponse.json(
      categoriesListResponseSchema.parse({
        categories: await listCategories(),
      }),
    ),
  );
}

export function POST(request: NextRequest) {
  return sessionBodyRoute(
    request,
    createCategorySchema,
    async (input, session) =>
      NextResponse.json(
        categoryRowSchema.parse(await createCategory(session.user, input)),
        { status: 201 },
      ),
  );
}
