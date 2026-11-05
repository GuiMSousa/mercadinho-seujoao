import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, homePath } from "@/contracts/auth";
import { readSession } from "@/domains/auth/sessions";

/** Auth screens are for signed-out visitors; a signed-in person goes to their profile's screen. */
export async function redirectIfSignedIn() {
  const session = await readSession(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (session) redirect(homePath(session.user.role));
}
