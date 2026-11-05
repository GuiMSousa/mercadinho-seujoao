import { NextResponse, type NextRequest } from "next/server";
import { dailySummarySentSchema } from "@/contracts/reports";
import { sendDailySummary } from "@/domains/reports/service";
import { adminRoute } from "../../../_lib/admin";

// ADMIN only, with the anti-CSRF header: sends today's summary to the account's own e-mail.
export function POST(request: NextRequest) {
  return adminRoute(request, async (session) =>
    NextResponse.json(
      dailySummarySentSchema.parse(await sendDailySummary(session.user)),
    ),
  );
}
