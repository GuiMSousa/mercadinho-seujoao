import { z } from "zod";

// Saved choice of color theme; absent means "follow the system".
export const THEME_COOKIE = "mkt_theme";
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const themeSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

export type ThemeChoice = z.infer<typeof themeSchema>["theme"];
