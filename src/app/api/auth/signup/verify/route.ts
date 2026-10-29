import type { NextRequest } from "next/server";
import { signupVerifySchema } from "@/contracts/auth";
import { verifyRateLimiter } from "@/domains/auth/login-rate-limit";
import { completeSignup } from "@/domains/auth/signup";
import { publicPost, sessionResponse } from "../../../_lib/public";

export function POST(request: NextRequest) {
  return publicPost(
    request,
    { limiter: verifyRateLimiter, schema: signupVerifySchema },
    async ({ email, code }, session) => {
      // completeSignup logs "Conta criada".
      const user = await completeSignup(email, code);
      return sessionResponse(request, user, session, false);
    },
  );
}
