import { NextResponse, type NextRequest } from "next/server";
import { changePasswordSchema } from "@/contracts/account";
import { changePassword } from "@/domains/users/service";
import { adminBodyRoute } from "../../_lib/admin";

export function POST(request: NextRequest) {
  return adminBodyRoute(
    request,
    changePasswordSchema,
    async ({ current, next }, session) => {
      await changePassword(session, current, next);
      return new NextResponse(null, { status: 204 });
    },
  );
}
