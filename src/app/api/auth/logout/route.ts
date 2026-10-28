import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookies, errorResponse, guard } from "../../_lib/guard";

export async function POST(request: NextRequest) {
  const { denial } = await guard(request);
  if (denial) return errorResponse(denial);
  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response);
  return response;
}
