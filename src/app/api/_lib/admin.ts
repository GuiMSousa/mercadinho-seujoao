import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { ServiceError } from "@/domains/auth/errors";
import type { AuthSession } from "@/domains/auth/sessions";
import { errorResponse, guard } from "./guard";
import { serviceErrorResponse, validationResponse } from "./public";

/**
 * Shared shape of the ADMIN routes: guard (session, role and CSRF), then `run` with the session.
 * A ServiceError becomes `{ error, fields? }` with its status.
 */
export async function adminRoute(
  request: NextRequest,
  run: (session: AuthSession) => Promise<NextResponse>,
) {
  const { session, denial } = await guard(request);
  if (denial || !session) return errorResponse(denial ?? 401);
  try {
    return await run(session);
  } catch (error) {
    if (error instanceof ServiceError) return serviceErrorResponse(error);
    throw error;
  }
}

/** Like `adminRoute` for a JSON body: not JSON is 400, a body that fails the schema is 422 with `fields`. */
export function adminBodyRoute<S extends z.ZodType>(
  request: NextRequest,
  schema: S,
  run: (input: z.output<S>, session: AuthSession) => Promise<NextResponse>,
) {
  return adminRoute(request, async (session) => {
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400);
    const input = schema.safeParse(body);
    if (!input.success) return validationResponse(input.error);
    return run(input.data, session);
  });
}
