import { NextResponse, type NextRequest } from "next/server";
import { SIGNUP_COOKIE, signupResendSchema } from "@/contracts/auth";
import { resendRateLimiter } from "@/domains/auth/login-rate-limit";
import { resendSignupCode } from "@/domains/auth/signup";
import { setSignupCookie } from "../../../_lib/guard";
import { publicPost } from "../../../_lib/public";

export function POST(request: NextRequest) {
  return publicPost(
    request,
    { limiter: resendRateLimiter, schema: signupResendSchema },
    async ({ email }) => {
      const nonce = request.cookies.get(SIGNUP_COOKIE)?.value;
      await resendSignupCode(email, nonce);
      const response = new NextResponse(null, { status: 202 });
      // The new code restarts the clock, so the proof of ownership must outlive it too.
      if (nonce) setSignupCookie(request, response, nonce);
      return response;
    },
  );
}
