import { NextResponse, type NextRequest } from "next/server";
import { changePasswordSchema } from "@/contracts/account";
import { passwordCheckRateLimiter } from "@/domains/auth/login-rate-limit";
import { changePassword } from "@/domains/users/service";
import { sessionBodyRoute } from "../../_lib/session-route";
import { tooManyResponse } from "../../_lib/public";

export function POST(request: NextRequest) {
  return sessionBodyRoute(
    request,
    changePasswordSchema,
    async ({ current, next }, session) => {
      // Every attempt counts: the current-password check is a guessing oracle for a stolen session.
      const limit = passwordCheckRateLimiter.hit(session.user.id);
      if (!limit.allowed) return tooManyResponse(limit.retryAfterSeconds);
      await changePassword(session, current, next);
      return new NextResponse(null, { status: 204 });
    },
  );
}
