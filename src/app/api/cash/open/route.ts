import { NextResponse, type NextRequest } from "next/server";
import { openCashSchema, openCashSessionSchema } from "@/contracts/cash";
import { openCashSession } from "@/domains/cash/service";
import { adminBodyRoute } from "../../_lib/admin";

// Open to any session (both profiles run the counter): the guard only restricts the ADMIN prefixes.
export function POST(request: NextRequest) {
  return adminBodyRoute(request, openCashSchema, async (input, session) =>
    NextResponse.json(
      openCashSessionSchema.parse(await openCashSession(session.user, input)),
      { status: 201 },
    ),
  );
}
