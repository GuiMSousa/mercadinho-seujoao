import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/contracts/auth";
import { readSession } from "@/domains/auth/sessions";

/** Auth screens are for signed-out visitors; a signed-in owner goes to the panel. */
export async function redirectIfSignedIn() {
  const session = await readSession(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  // Only the panel exists so far: sending a CASHIER to "/" would loop back to /login.
  if (session?.user.role === "ADMIN") redirect("/painel");
}
