import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, guard } from "@/app/api/_lib/guard";

// Optimistic gate before rendering. Next.js proxy is not a complete auth layer,
// so every route handler applies the same guard again.
export async function proxy(request: NextRequest) {
  const { denial } = await guard(request);
  if (denial === null) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/"))
    return errorResponse(denial);
  if (denial === 401)
    return NextResponse.redirect(new URL("/login", request.url));
  return new NextResponse("Acesso negado.", { status: 403 });
}

export const config = {
  // Skip build assets and any path with a file extension (favicon, images, fonts).
  matcher: ["/((?!_next/static|_next/image|.*\\.[^/]+$).*)"],
};
