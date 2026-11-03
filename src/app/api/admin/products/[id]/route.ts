import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { productRowSchema, updateProductSchema } from "@/contracts/inventory";
import { ServiceError } from "@/domains/auth/errors";
import { updateProduct } from "@/domains/inventory/service";
import { adminBodyRoute } from "../../../_lib/admin";

export function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return adminBodyRoute(
    request,
    updateProductSchema,
    async (input, session) => {
      const id = z.uuid().safeParse((await params).id);
      // A malformed id can match no product; checking here keeps Postgres from failing with a 500.
      if (!id.success) throw new ServiceError(404, "Produto não encontrado.");
      return NextResponse.json(
        productRowSchema.parse(
          await updateProduct(session.user, id.data, input),
        ),
      );
    },
  );
}
