import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, guard } from "@/app/api/_lib/guard";

const redirectTo = (path: string, request: NextRequest) =>
  NextResponse.redirect(new URL(path, request.url));

// Optimistic gate before rendering. Next.js proxy is not a complete auth layer,
// so every route handler applies the same guard again.
export async function proxy(request: NextRequest) {
  const { session, denial } = await guard(request);
  if (denial === null) {
    if (request.nextUrl.pathname !== "/") return NextResponse.next();
    // The home path routes by role: the owner lands on the panel.
    if (!session) return redirectTo("/login", request);
    if (session.user.role === "ADMIN") return redirectTo("/painel", request);
    return NextResponse.next();
  }
  if (request.nextUrl.pathname.startsWith("/api/"))
    return errorResponse(denial);
  if (denial === 401) return redirectTo("/login", request);
  return new NextResponse("Acesso negado.", { status: 403 });
}

export const config = {
  // Skip build assets and any path with a file extension (favicon, images, fonts).
  matcher: ["/((?!_next/static|_next/image|.*\\.[^/]+$).*)"],
};
