import { cookies } from "next/headers";
import { THEME_COOKIE } from "@/contracts/theme";

/** The saved theme, or undefined when the app should follow the system. */
export async function getTheme() {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return value === "light" || value === "dark" ? value : undefined;
}
