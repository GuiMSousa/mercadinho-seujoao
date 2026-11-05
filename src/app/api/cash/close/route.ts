import { NextResponse, type NextRequest } from "next/server";
import { closeCashSchema, closedCashSchema } from "@/contracts/cash";
import { closeCashSession } from "@/domains/cash/service";
import { adminBodyRoute } from "../../_lib/admin";

// Open to any session. Blind: the answer never carries the expected amount or the difference.
export function POST(request: NextRequest) {
  return adminBodyRoute(request, closeCashSchema, async (input, session) =>
    NextResponse.json(
      closedCashSchema.parse(await closeCashSession(session.user, input)),
    ),
  );
}
