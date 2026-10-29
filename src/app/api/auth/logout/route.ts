import { NextResponse, type NextRequest } from "next/server";
import { revokeSession } from "@/domains/auth/sessions";
import { clearSessionCookies, errorResponse, guard } from "../../_lib/guard";

export async function POST(request: NextRequest) {
  const { session, denial } = await guard(request);
  // Logout is never public, so a missing session always comes with a denial.
  if (denial || !session) return errorResponse(denial ?? 401);
  await revokeSession(session.id);
  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response);
  return response;
}
