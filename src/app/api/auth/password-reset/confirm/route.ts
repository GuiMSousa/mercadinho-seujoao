import { NextResponse, type NextRequest } from "next/server";
import { passwordResetConfirmSchema } from "@/contracts/auth";
import { resetConfirmRateLimiter } from "@/domains/auth/login-rate-limit";
import { confirmPasswordReset } from "@/domains/auth/password-reset";
import { publicPost } from "../../../_lib/public";

export function POST(request: NextRequest) {
  return publicPost(
    request,
    { limiter: resetConfirmRateLimiter, schema: passwordResetConfirmSchema },
    async ({ email, code, password }) => {
      await confirmPasswordReset(email, code, password);
      return new NextResponse(null, { status: 204 });
    },
  );
}
