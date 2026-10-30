import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/contracts/auth";
import { readSession } from "@/domains/auth/sessions";

/** Auth screens are for signed-out visitors; "/" routes a signed-in user by role. */
export async function redirectIfSignedIn() {
  if (await readSession((await cookies()).get(SESSION_COOKIE)?.value))
    redirect("/");
}
