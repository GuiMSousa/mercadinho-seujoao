import { NextResponse, type NextRequest } from "next/server";
import { SIGNUP_COOKIE, signupResendSchema } from "@/contracts/auth";
import { resendRateLimiter } from "@/domains/auth/login-rate-limit";
import { resendSignupCode } from "@/domains/auth/signup";
import { publicPost } from "../../../_lib/public";

export function POST(request: NextRequest) {
  return publicPost(
    request,
    { limiter: resendRateLimiter, schema: signupResendSchema },
    async ({ email }) => {
      await resendSignupCode(email, request.cookies.get(SIGNUP_COOKIE)?.value);
      return new NextResponse(null, { status: 202 });
    },
  );
}
