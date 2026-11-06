import { NextResponse, type NextRequest } from "next/server";
import { listQuerySchema } from "@/contracts/inventory";
import {
  createSupplierSchema,
  supplierRowSchema,
  suppliersPageSchema,
} from "@/contracts/suppliers";
import { createSupplier, listSuppliers } from "@/domains/suppliers/service";
import { sessionBodyRoute, sessionRoute } from "../../_lib/session-route";
import { errorResponse } from "../../_lib/guard";

// ADMIN only: /api/admin is an ADMIN prefix in the shared access rule.
export function GET(request: NextRequest) {
  return sessionRoute(request, async () => {
    const query = listQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!query.success) return errorResponse(400);
    return NextResponse.json(
      suppliersPageSchema.parse(await listSuppliers(query.data)),
    );
  });
}

export function POST(request: NextRequest) {
  return sessionBodyRoute(
    request,
    createSupplierSchema,
    async (input, session) =>
      NextResponse.json(
        supplierRowSchema.parse(await createSupplier(session.user, input)),
        { status: 201 },
      ),
  );
}
