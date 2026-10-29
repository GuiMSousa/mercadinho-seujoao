import { NextResponse, type NextRequest } from "next/server";
import { revokedSessionsSchema } from "@/contracts/account";
import { endOtherSessions } from "@/domains/users/service";
import { adminRoute } from "../../../_lib/admin";

export function POST(request: NextRequest) {
  return adminRoute(request, async (session) =>
    NextResponse.json(
      revokedSessionsSchema.parse({ revoked: await endOtherSessions(session) }),
    ),
  );
}
