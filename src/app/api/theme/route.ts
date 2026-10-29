import { NextResponse, type NextRequest } from "next/server";
import {
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE_SECONDS,
  themeSchema,
} from "@/contracts/theme";
import { errorResponse, guard, isSecure } from "../_lib/guard";

// Public (the login screen has a theme toggle); the guard still applies the origin check.
export async function POST(request: NextRequest) {
  const { denial } = await guard(request);
  if (denial) return errorResponse(denial);

  const input = themeSchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!input.success) return errorResponse(400);

  const response = new NextResponse(null, { status: 204 });
  if (input.data.theme === "system") {
    response.cookies.delete(THEME_COOKIE);
  } else {
    response.cookies.set(THEME_COOKIE, input.data.theme, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure(request),
      path: "/",
      maxAge: THEME_COOKIE_MAX_AGE_SECONDS,
    });
  }
  return response;
}
