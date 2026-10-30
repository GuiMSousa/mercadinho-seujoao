import type { NextRequest } from "next/server";
import { loginRequestSchema } from "@/contracts/auth";
import { logActivity } from "@/domains/activity/service";
import {
  loginAccountRateLimiter,
  loginRateLimiter,
} from "@/domains/auth/login-rate-limit";
import { authenticate, recordLogin } from "@/domains/auth/service";
import { errorResponse } from "../../_lib/guard";
import { publicPost, sessionResponse } from "../../_lib/public";

const DENIED = {
  invalid: { status: 401, message: "E-mail ou senha incorretos." },
  // An invitee without a password gets the same answer, so it does not reveal the account.
  no_password: { status: 401, message: "E-mail ou senha incorretos." },
  inactive: {
    status: 403,
    message: "Este acesso está desativado. Fale com o administrador da loja.",
  },
  not_admin: {
    status: 403,
    message:
      "Este painel é exclusivo para administradores. Operadores usam o PDV.",
  },
} as const;

export function POST(request: NextRequest) {
  return publicPost(
    request,
    {
      limiter: loginRateLimiter,
      schema: loginRequestSchema,
      limitMessage: "Muitas tentativas de login. Tente novamente mais tarde.",
      account: { limiter: loginAccountRateLimiter, key: ({ email }) => email },
    },
    async ({ email, password, remember }, session) => {
      const result = await authenticate(email, password);
      if (!result.ok) {
        const { status, message } = DENIED[result.reason];
        return errorResponse(status, message);
      }

      await recordLogin(result.user.id);
      const response = await sessionResponse(
        request,
        result.user,
        session,
        remember,
      );
      await logActivity({
        user: { id: result.user.id, name: result.user.name },
        action: "Login",
      });
      return response;
    },
  );
}
