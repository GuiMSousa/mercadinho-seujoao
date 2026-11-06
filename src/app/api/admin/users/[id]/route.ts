import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { updateUserSchema, userRowSchema } from "@/contracts/users";
import { ServiceError } from "@/domains/auth/errors";
import { updateUser } from "@/domains/users/service";
import { sessionBodyRoute } from "../../../_lib/session-route";

export function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return sessionBodyRoute(request, updateUserSchema, async (input, session) => {
    const id = z.uuid().safeParse((await params).id);
    // A malformed id can match no user; checking here keeps Postgres from failing with a 500.
    if (!id.success) throw new ServiceError(404, "Usuário não encontrado.");
    return NextResponse.json(
      userRowSchema.parse(await updateUser(session.user, id.data, input)),
    );
  });
}
