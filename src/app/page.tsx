import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/contracts/auth";
import { readSession } from "@/domains/auth/sessions";
import { Landing } from "./_landing/landing";
import { getTheme } from "./theme";

// The proxy already sends the owner to the panel; this is the fallback when it did not.
export default async function Home() {
  const session = await readSession(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (session?.user.role === "ADMIN") redirect("/painel");
  return <Landing initialTheme={await getTheme()} />;
}
