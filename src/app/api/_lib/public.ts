import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { loginResponseSchema, type AuthUser } from "@/contracts/auth";
import { ServiceError } from "@/domains/auth/errors";
import {
  clientIp,
  type createRateLimiter,
} from "@/domains/auth/login-rate-limit";
import {
  createSession,
  revokeSession,
  type AuthSession,
} from "@/domains/auth/sessions";
import { errorResponse, guard, setSessionCookies } from "./guard";

type Limiter = ReturnType<typeof createRateLimiter>;

function validationResponse(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues)
    fields[String(issue.path[0] ?? "form")] ??= issue.message;
  return NextResponse.json(
    { error: "Revise os campos informados.", fields },
    { status: 422 },
  );
}

function serviceErrorResponse(error: ServiceError) {
  const { fields, retryAfterSeconds } = error.options;
  return NextResponse.json(
    { error: error.message, ...(fields && { fields }) },
    {
      status: error.status,
      ...(retryAfterSeconds && {
        headers: { "Retry-After": String(retryAfterSeconds) },
      }),
    },
  );
}

/**
 * Shared shape of the public POST routes: guard, per-action rate limit (every attempt counts),
 * body validation, then `run`. A ServiceError becomes a form error with its status.
 * A body that fails the schema is a 422 with `fields`, or a plain 400 when `invalidMessage` is set.
 */
export async function publicPost<S extends z.ZodType>(
  request: NextRequest,
  options: {
    limiter: Limiter;
    schema: S;
    limitMessage?: string;
    invalidMessage?: string;
  },
  run: (
    input: z.output<S>,
    session: AuthSession | null,
  ) => Promise<NextResponse>,
) {
  const { session, denial } = await guard(request);
  if (denial) return errorResponse(denial);

  const limit = options.limiter.hit(clientIp(request.headers));
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error:
          options.limitMessage ??
          "Muitas tentativas. Tente novamente mais tarde.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const body: unknown = await request.json().catch(() => undefined);
  if (body === undefined) return errorResponse(400);
  const input = options.schema.safeParse(body);
  if (!input.success) {
    return options.invalidMessage
      ? errorResponse(400, options.invalidMessage)
      : validationResponse(input.error);
  }
  try {
    return await run(input.data, session);
  } catch (error) {
    if (error instanceof ServiceError) return serviceErrorResponse(error);
    throw error;
  }
}

/** Opens a session for `user` (ending the one the request carried) and answers with the cookies and `{ user, csrfToken }`. */
export async function sessionResponse(
  request: NextRequest,
  user: AuthUser,
  previous: AuthSession | null,
  remember: boolean,
) {
  if (previous) await revokeSession(previous.id);
  const session = await createSession({
    userId: user.id,
    remember,
    userAgent: request.headers.get("user-agent"),
    ip: clientIp(request.headers),
  });
  const response = NextResponse.json(
    loginResponseSchema.parse({ user, csrfToken: session.csrfToken }),
  );
  setSessionCookies(request, response, session);
  return response;
}
