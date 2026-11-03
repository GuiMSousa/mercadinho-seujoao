import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { batchRowSchema, createBatchSchema } from "@/contracts/inventory";
import { ServiceError } from "@/domains/auth/errors";
import { receiveBatch } from "@/domains/inventory/service";
import { adminBodyRoute } from "../../../../_lib/admin";

export function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return adminBodyRoute(request, createBatchSchema, async (input, session) => {
    const id = z.uuid().safeParse((await params).id);
    // A malformed id can match no product; checking here keeps Postgres from failing with a 500.
    if (!id.success) throw new ServiceError(404, "Produto não encontrado.");
    return NextResponse.json(
      batchRowSchema.parse(await receiveBatch(session.user.id, id.data, input)),
      { status: 201 },
    );
  });
}
