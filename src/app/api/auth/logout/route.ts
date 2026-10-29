import { NextResponse, type NextRequest } from "next/server";
import { logActivity } from "@/domains/activity/service";
import { revokeSession } from "@/domains/auth/sessions";
import { clearSessionCookies, errorResponse, guard } from "../../_lib/guard";

export async function POST(request: NextRequest) {
  const { session, denial } = await guard(request);
  if (denial === 401) {
    // The session is gone (revoked elsewhere or expired): drop the stale cookies too.
    const response = errorResponse(401);
    clearSessionCookies(response);
    return response;
  }
  // Logout is never public, so a missing session always comes with a denial.
  if (denial || !session) return errorResponse(denial ?? 401);
  await revokeSession(session.id);
  await logActivity({
    user: { id: session.user.id, name: session.user.name },
    action: "Logout",
  });
  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response);
  return response;
}
