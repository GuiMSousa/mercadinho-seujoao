import { createHash } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";
import * as repository from "./sessions-repository";
import {
  createSession,
  hashToken,
  readSession,
  revokeAllSessions,
  revokeOtherSessions,
  revokeSession,
} from "./sessions";

vi.mock("server-only", () => ({}));
vi.mock("./sessions-repository");

const NOW = new Date("2026-01-10T12:00:00Z");
const minutesAgo = (minutes: number) =>
  new Date(NOW.getTime() - minutes * 60_000);
const hoursAhead = (hours: number) =>
  new Date(NOW.getTime() + hours * 3_600_000);
const DAY = 24 * 3_600_000;

const row = (overrides: Partial<repository.SessionRow> = {}) => ({
  userId: "u1",
  csrfHash: "csrf-hash",
  remember: false,
  expiresAt: hoursAhead(6),
  lastUsedAt: minutesAgo(0),
  userName: "Maria",
  userEmail: "maria@example.com",
  userRole: "CASHIER" as const,
  userActive: true,
  sessionIdle: "8h" as const,
  ...overrides,
});
const found = (overrides?: Partial<repository.SessionRow>) =>
  vi.mocked(repository.findSessionRow).mockResolvedValue(row(overrides));

beforeEach(() => vi.resetAllMocks());

it("hashes tokens with sha-256 hex", () => {
  expect(hashToken("abc")).toBe(
    createHash("sha256").update("abc").digest("hex"),
  );
});

it("creates sessions whose token and CSRF token are random and stored only as hashes", async () => {
  const input = { userId: "u1", userAgent: "UA", ip: "203.0.113.1" };
  const first = await createSession({ ...input, remember: false });
  const second = await createSession({ ...input, remember: false });
  expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(first.csrfToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(first.token).not.toBe(second.token);
  expect(first.token).not.toBe(first.csrfToken);
  expect(first.maxAgeSeconds).toBeNull();

  const [stored] = vi.mocked(repository.insertSession).mock.calls[0];
  expect(stored).toMatchObject({
    id: hashToken(first.token),
    csrfHash: hashToken(first.csrfToken),
    userId: "u1",
    remember: false,
    userAgent: "UA",
    ip: "203.0.113.1",
  });
  const ttl = stored.expiresAt.getTime() - Date.now();
  expect(Math.abs(ttl - 12 * 3_600_000)).toBeLessThan(5_000);
});

it("remembers for 30 days with a persistent cookie", async () => {
  const created = await createSession({
    userId: "u1",
    remember: true,
    userAgent: null,
    ip: "203.0.113.1",
  });
  expect(created.maxAgeSeconds).toBe(30 * 86_400);
  const [stored] = vi.mocked(repository.insertSession).mock.calls[0];
  const ttl = stored.expiresAt.getTime() - Date.now();
  expect(Math.abs(ttl - 30 * DAY)).toBeLessThan(5_000);
});

it("returns the session for a valid token and looks it up by hash", async () => {
  found();
  await expect(readSession("token", NOW)).resolves.toEqual({
    id: hashToken("token"),
    user: {
      id: "u1",
      name: "Maria",
      email: "maria@example.com",
      role: "CASHIER",
    },
    csrfHash: "csrf-hash",
    remember: false,
  });
  expect(repository.findSessionRow).toHaveBeenCalledWith(hashToken("token"));
});

it("returns null for a missing token or unknown session", async () => {
  await expect(readSession(undefined, NOW)).resolves.toBeNull();
  await expect(readSession("", NOW)).resolves.toBeNull();
  expect(repository.findSessionRow).not.toHaveBeenCalled();
  vi.mocked(repository.findSessionRow).mockResolvedValue(undefined);
  await expect(readSession("token", NOW)).resolves.toBeNull();
});

it("returns null after expiry and removes the row", async () => {
  found({ expiresAt: minutesAgo(1) });
  await expect(readSession("token", NOW)).resolves.toBeNull();
  expect(repository.deleteSession).toHaveBeenCalledWith(hashToken("token"));
});

it("returns null for an inactive user", async () => {
  found({ userActive: false });
  await expect(readSession("token", NOW)).resolves.toBeNull();
});

it("expires on idleness by the store setting, and never with 'never'", async () => {
  found({ sessionIdle: "1h", lastUsedAt: minutesAgo(61) });
  await expect(readSession("token", NOW)).resolves.toBeNull();
  expect(repository.deleteSession).toHaveBeenCalledWith(hashToken("token"));

  found({ sessionIdle: "1h", lastUsedAt: minutesAgo(59) });
  await expect(readSession("token", NOW)).resolves.not.toBeNull();

  found({ sessionIdle: "24h", lastUsedAt: minutesAgo(23 * 60) });
  await expect(readSession("token", NOW)).resolves.not.toBeNull();

  found({ sessionIdle: "never", lastUsedAt: minutesAgo(400 * 24 * 60) });
  await expect(readSession("token", NOW)).resolves.not.toBeNull();
});

it("treats a missing store as 8h of idle time", async () => {
  found({ sessionIdle: null, lastUsedAt: minutesAgo(7 * 60) });
  await expect(readSession("token", NOW)).resolves.not.toBeNull();
  found({ sessionIdle: null, lastUsedAt: minutesAgo(9 * 60) });
  await expect(readSession("token", NOW)).resolves.toBeNull();
});

it("touches lastUsedAt only after a minute, and slides expiry only with remember", async () => {
  found({ lastUsedAt: minutesAgo(0.5) });
  await readSession("token", NOW);
  expect(repository.updateSession).not.toHaveBeenCalled();

  found({ lastUsedAt: minutesAgo(2) });
  await readSession("token", NOW);
  expect(repository.updateSession).toHaveBeenLastCalledWith(
    hashToken("token"),
    { lastUsedAt: NOW },
  );

  found({ lastUsedAt: minutesAgo(2), remember: true });
  await readSession("token", NOW);
  expect(repository.updateSession).toHaveBeenLastCalledWith(
    hashToken("token"),
    { lastUsedAt: NOW, expiresAt: new Date(NOW.getTime() + 30 * DAY) },
  );
});

it("reports renewed only when a remembered session had its expiry pushed out", async () => {
  found({ lastUsedAt: minutesAgo(2), remember: true });
  await expect(readSession("token", NOW)).resolves.toMatchObject({
    renewed: true,
  });
  // Touched less than a minute ago: nothing was written, so the cookie is not re-issued.
  found({ lastUsedAt: minutesAgo(0.5), remember: true });
  await expect(readSession("token", NOW)).resolves.not.toHaveProperty(
    "renewed",
    true,
  );
  found({ lastUsedAt: minutesAgo(2), remember: false });
  await expect(readSession("token", NOW)).resolves.not.toHaveProperty(
    "renewed",
    true,
  );
});

it("revokes one session, the others of a user, or all of them", async () => {
  await revokeSession("id1");
  expect(repository.deleteSession).toHaveBeenCalledWith("id1");

  vi.mocked(repository.deleteOtherSessions).mockResolvedValue(2);
  await expect(revokeOtherSessions("u1", "keep")).resolves.toBe(2);
  expect(repository.deleteOtherSessions).toHaveBeenCalledWith("u1", "keep");

  await revokeAllSessions("u1");
  expect(repository.deleteAllSessions).toHaveBeenCalledWith("u1");
});
