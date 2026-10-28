import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { loginRequestSchema, loginResponseSchema } from "@/contracts/auth";
import { clientIp, loginRateLimiter } from "@/domains/auth/login-rate-limit";
import { authenticate } from "@/domains/auth/service";
import { createSessionToken } from "@/domains/auth/session";
import { errorResponse, guard, setSessionCookies } from "../../_lib/guard";

export async function POST(request: NextRequest) {
  const { denial } = await guard(request);
  if (denial) return errorResponse(denial);

  // Every attempt counts, valid or not: the 11th within 15 minutes is refused.
  const limit = loginRateLimiter.hit(clientIp(request.headers));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas de login. Tente novamente mais tarde." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const input = loginRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!input.success) return errorResponse(400, "Informe usuário e senha.");

  const user = await authenticate(input.data.username, input.data.password);
  if (!user) return errorResponse(401, "Usuário ou senha inválidos.");

  const csrf = randomBytes(32).toString("base64url");
  const token = await createSessionToken({ ...user, csrf });
  const response = NextResponse.json(
    loginResponseSchema.parse({ user, csrfToken: csrf }),
  );
  setSessionCookies(request, response, token, csrf);
  return response;
}
