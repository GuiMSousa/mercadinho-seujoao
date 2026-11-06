import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supplierRowSchema, updateSupplierSchema } from "@/contracts/suppliers";
import { ServiceError } from "@/domains/auth/errors";
import { updateSupplier } from "@/domains/suppliers/service";
import { sessionBodyRoute } from "../../../_lib/session-route";

export function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return sessionBodyRoute(
    request,
    updateSupplierSchema,
    async (input, session) => {
      const id = z.uuid().safeParse((await params).id);
      // A malformed id can match no supplier; checking here keeps Postgres from failing with a 500.
      if (!id.success)
        throw new ServiceError(404, "Fornecedor não encontrado.");
      return NextResponse.json(
        supplierRowSchema.parse(
          await updateSupplier(session.user, id.data, input),
        ),
      );
    },
  );
}
