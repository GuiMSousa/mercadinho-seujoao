import { z } from "zod";
import { userRole } from "@/infrastructure/db/schema";

export const SESSION_COOKIE = "mkt_session";
// Readable by the page so it can echo the token in CSRF_HEADER on mutations.
export const CSRF_COOKIE = "mkt_csrf";
export const CSRF_HEADER = "x-csrf-token";

export const loginRequestSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(64),
  // Upper bound caps the cost of hashing attacker-supplied input.
  password: z.string().min(1).max(256),
});

export const userSummarySchema = z.object({
  id: z.uuid(),
  username: z.string(),
  role: z.enum(userRole.enumValues),
});

export const loginResponseSchema = z.object({
  user: userSummarySchema,
  csrfToken: z.string(),
});

export const usersListResponseSchema = z.object({
  users: z.array(userSummarySchema),
});

export const errorResponseSchema = z.object({ error: z.string() });

export type UserSummary = z.infer<typeof userSummarySchema>;
