import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/contracts/auth";
import { readSession } from "@/domains/auth/sessions";

// The proxy already routes "/" by role; this is the fallback when it did not.
export default async function Home() {
  const session = await readSession(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  redirect(session?.user.role === "ADMIN" ? "/painel" : "/login");
}
