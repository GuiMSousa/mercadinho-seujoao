import { NextResponse, type NextRequest } from "next/server";
import { revokedSessionsSchema } from "@/contracts/account";
import { endOtherSessions } from "@/domains/users/service";
import { sessionRoute } from "../../../_lib/session-route";

export function POST(request: NextRequest) {
  return sessionRoute(request, async (session) =>
    NextResponse.json(
      revokedSessionsSchema.parse({ revoked: await endOtherSessions(session) }),
    ),
  );
}
