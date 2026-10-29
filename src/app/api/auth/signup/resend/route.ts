import { NextResponse, type NextRequest } from "next/server";
import { signupResendSchema } from "@/contracts/auth";
import { resendRateLimiter } from "@/domains/auth/login-rate-limit";
import { resendSignupCode } from "@/domains/auth/signup";
import { publicPost } from "../../../_lib/public";

export function POST(request: NextRequest) {
  return publicPost(
    request,
    { limiter: resendRateLimiter, schema: signupResendSchema },
    async ({ email }) => {
      await resendSignupCode(email);
      return new NextResponse(null, { status: 202 });
    },
  );
}
