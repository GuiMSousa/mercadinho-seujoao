import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { Role } from "@/infrastructure/db/schema";
import * as repository from "./sessions-repository";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const REMEMBER_MS = 30 * 24 * HOUR_MS;
const SHIFT_MS = 12 * HOUR_MS;
// Throttles the write that records activity.
const TOUCH_AFTER_MS = MINUTE_MS;
const DEFAULT_IDLE_MS = 8 * HOUR_MS;
const IDLE_MS = {
  "1h": HOUR_MS,
  "8h": 8 * HOUR_MS,
  "24h": 24 * HOUR_MS,
  never: Infinity,
} as const;

export type AuthSession = {
  // SHA-256 of the cookie token, the same value as sessions.id.
  id: string;
  user: { id: string; name: string; email: string; role: Role };
  csrfHash: string;
  remember: boolean;
};

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const newToken = () => randomBytes(32).toString("base64url");

export async function createSession(input: {
  userId: string;
  remember: boolean;
  userAgent: string | null;
  ip: string;
}) {
  const token = newToken();
  const csrfToken = newToken();
  const lifetimeMs = input.remember ? REMEMBER_MS : SHIFT_MS;
  await repository.insertSession({
    id: hashToken(token),
    userId: input.userId,
    csrfHash: hashToken(csrfToken),
    remember: input.remember,
    expiresAt: new Date(Date.now() + lifetimeMs),
    userAgent: input.userAgent,
    ip: input.ip,
  });
  return {
    token,
    csrfToken,
    // Null means a browser-session cookie.
    maxAgeSeconds: input.remember ? REMEMBER_MS / 1000 : null,
  };
}

/** Null when the token is unknown, expired, idle for too long or its user is inactive. */
export async function readSession(
  token: string | undefined,
  now = new Date(),
): Promise<AuthSession | null> {
  if (!token) return null;
  const id = hashToken(token);
  const row = await repository.findSessionRow(id);
  if (!row) return null;

  const idleMs = row.sessionIdle ? IDLE_MS[row.sessionIdle] : DEFAULT_IDLE_MS;
  const sinceUse = now.getTime() - row.lastUsedAt.getTime();
  if (row.expiresAt <= now || sinceUse > idleMs) {
    await repository.deleteSession(id);
    return null;
  }
  if (!row.userActive) return null;

  if (sinceUse >= TOUCH_AFTER_MS) {
    await repository.updateSession(
      id,
      row.remember
        ? {
            lastUsedAt: now,
            expiresAt: new Date(now.getTime() + REMEMBER_MS),
          }
        : { lastUsedAt: now },
    );
  }
  return {
    id,
    user: {
      id: row.userId,
      name: row.userName,
      email: row.userEmail,
      role: row.userRole,
    },
    // A session without a CSRF hash can never pass the CSRF check.
    csrfHash: row.csrfHash ?? "",
    remember: row.remember,
  };
}

export const revokeSession = (id: string) => repository.deleteSession(id);

export const revokeOtherSessions = (userId: string, keepId: string) =>
  repository.deleteOtherSessions(userId, keepId);

export const revokeAllSessions = (userId: string) =>
  repository.deleteAllSessions(userId);
