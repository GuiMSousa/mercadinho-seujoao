import { NextResponse, type NextRequest } from "next/server";
import { loginRequestSchema, loginResponseSchema } from "@/contracts/auth";
import { clientIp, loginRateLimiter } from "@/domains/auth/login-rate-limit";
import { authenticate } from "@/domains/auth/service";
import { createSession } from "@/domains/auth/sessions";
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
  if (!input.success) return errorResponse(400, "Informe e-mail e senha.");

  const user = await authenticate(input.data.email, input.data.password);
  if (!user) return errorResponse(401, "E-mail ou senha inválidos.");

  const session = await createSession({
    userId: user.id,
    remember: false,
    userAgent: request.headers.get("user-agent"),
    ip: clientIp(request.headers),
  });
  const response = NextResponse.json(
    loginResponseSchema.parse({ user, csrfToken: session.csrfToken }),
  );
  setSessionCookies(request, response, session);
  return response;
}
