import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { userSummarySchema, type UserSummary } from "@/contracts/auth";
import { getSessionSecret } from "@/lib/env";

// One long shift; the cookie and the token expire together.
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

export type Session = UserSummary & { csrf: string };

const claimsSchema = z.object({
  sub: userSummarySchema.shape.id,
  username: userSummarySchema.shape.username,
  role: userSummarySchema.shape.role,
  csrf: z.string().min(1),
});

const signingKey = () => new TextEncoder().encode(getSessionSecret());

export function createSessionToken({ id, username, role, csrf }: Session) {
  return new SignJWT({ username, role, csrf })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(signingKey());
}

/** Returns null for a missing, tampered, expired or malformed token. */
export async function readSessionToken(
  token: string | undefined,
): Promise<Session | null> {
  if (!token) return null;
  // Outside the try: a missing SESSION_SECRET is a misconfiguration and must fail loudly.
  const key = signingKey();
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const claims = claimsSchema.safeParse(payload);
    if (!claims.success) return null;
    const { sub, username, role, csrf } = claims.data;
    return { id: sub, username, role, csrf };
  } catch {
    return null;
  }
}
