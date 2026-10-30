import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/contracts/auth";
import { readSession } from "@/domains/auth/sessions";

/**
 * Session of the signed-in ADMIN, or a redirect to /login. Call it at the top of every panel page
 * that reads data (cached per request: layout and page share one session read): layouts do not re-run on client navigation, and the proxy only checks the cookie.
 */
export const requireAdmin = cache(async () => {
  const session = await readSession(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (session?.user.role !== "ADMIN") redirect("/login");
  return session;
});
