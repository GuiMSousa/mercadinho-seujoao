import { NextResponse, type NextRequest } from "next/server";
import { signupRequestSchema } from "@/contracts/auth";
import { signupRateLimiter } from "@/domains/auth/login-rate-limit";
import { startSignup } from "@/domains/auth/signup";
import { setSignupCookie } from "../../_lib/guard";
import { publicPost } from "../../_lib/public";

export function POST(request: NextRequest) {
  return publicPost(
    request,
    { limiter: signupRateLimiter, schema: signupRequestSchema },
    async (input) => {
      const nonce = await startSignup(input);
      const response = new NextResponse(null, { status: 202 });
      setSignupCookie(request, response, nonce);
      return response;
    },
  );
}
