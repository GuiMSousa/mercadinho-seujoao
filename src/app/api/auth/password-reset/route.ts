import { NextResponse, type NextRequest } from "next/server";
import { passwordResetSchema } from "@/contracts/auth";
import { resetRateLimiter } from "@/domains/auth/login-rate-limit";
import { requestPasswordReset } from "@/domains/auth/password-reset";
import { publicPost } from "../../_lib/public";

export function POST(request: NextRequest) {
  return publicPost(
    request,
    { limiter: resetRateLimiter, schema: passwordResetSchema },
    async ({ email }) => {
      await requestPasswordReset(email);
      // Same answer whether or not the account exists.
      return new NextResponse(null, { status: 202 });
    },
  );
}
