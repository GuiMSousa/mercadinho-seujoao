import type { NextRequest } from "next/server";
import { SIGNUP_COOKIE, signupVerifySchema } from "@/contracts/auth";
import { verifyRateLimiter } from "@/domains/auth/login-rate-limit";
import { completeSignup } from "@/domains/auth/signup";
import { clearSignupCookie } from "../../../_lib/guard";
import { publicPost, sessionResponse } from "../../../_lib/public";

export function POST(request: NextRequest) {
  return publicPost(
    request,
    { limiter: verifyRateLimiter, schema: signupVerifySchema },
    async ({ email, code }, session) => {
      // completeSignup logs "Conta criada".
      const user = await completeSignup(
        email,
        code,
        request.cookies.get(SIGNUP_COOKIE)?.value,
      );
      const response = await sessionResponse(request, user, session, false);
      clearSignupCookie(response);
      return response;
    },
  );
}
