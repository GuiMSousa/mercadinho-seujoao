import { eq } from "drizzle-orm";
import { expect, it, vi } from "vitest";
import { sessions, stores, users } from "@/infrastructure/db/schema";
import { withTestDb, type TestDb } from "@/infrastructure/db/test-db";
import {
  createSession,
  hashToken,
  readSession,
  revokeAllSessions,
  revokeOtherSessions,
  revokeSession,
} from "./sessions";

vi.mock("server-only", () => ({}));

// The repository reaches the database through getDb(); point it at the test transaction.
let current: TestDb;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

const meta = { userAgent: "UA", ip: "203.0.113.1" };
const HOUR = 3_600_000;

const inTest = (fn: (db: TestDb) => Promise<void>) =>
  withTestDb(async (db) => {
    current = db;
    await fn(db);
  });

async function newUser(db: TestDb, email = "maria@example.com") {
  const [user] = await db
    .insert(users)
    .values({ name: "Maria", email, role: "ADMIN" })
    .returning();
  return user;
}

const open = (userId: string, remember = false) =>
  createSession({ userId, remember, ...meta });

const backdate = (db: TestDb, token: string, msAgo: number) =>
  db
    .update(sessions)
    .set({ lastUsedAt: new Date(Date.now() - msAgo) })
    .where(eq(sessions.id, hashToken(token)));

it("creates a session, reads it back by token and stores only hashes", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    const { token, csrfToken } = await open(user.id);
    const [stored] = await db.select().from(sessions);
    expect(stored.id).toBe(hashToken(token));
    expect(stored.csrfHash).toBe(hashToken(csrfToken));

    await expect(readSession(token)).resolves.toMatchObject({
      id: stored.id,
      user: { id: user.id, role: "ADMIN", email: "maria@example.com" },
      csrfHash: stored.csrfHash,
    });
    await expect(readSession("not-a-token")).resolves.toBeNull();
  }));

it("revokeOtherSessions keeps only the current one", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    const mine = await open(user.id);
    const other = await open(user.id, true);
    const bystander = await newUser(db, "joao@example.com");
    const theirs = await open(bystander.id);

    await expect(
      revokeOtherSessions(user.id, hashToken(mine.token)),
    ).resolves.toBe(1);

    await expect(readSession(other.token)).resolves.toBeNull();
    await expect(readSession(mine.token)).resolves.not.toBeNull();
    await expect(readSession(theirs.token)).resolves.not.toBeNull();
  }));

it("revokeSession and revokeAllSessions invalidate the token on the next read", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    const a = await open(user.id);
    const b = await open(user.id);
    await revokeSession(hashToken(a.token));
    await expect(readSession(a.token)).resolves.toBeNull();
    await expect(readSession(b.token)).resolves.not.toBeNull();
    await revokeAllSessions(user.id);
    await expect(readSession(b.token)).resolves.toBeNull();
  }));

it("defaults idle to 8h without a store, then follows the store setting", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    const stale = await open(user.id);
    await backdate(db, stale.token, 9 * HOUR);
    await expect(readSession(stale.token)).resolves.toBeNull();

    const fresh = await open(user.id);
    await db.insert(stores).values({ name: "Loja", sessionIdle: "never" });
    await backdate(db, fresh.token, 400 * 24 * HOUR);
    await expect(readSession(fresh.token)).resolves.not.toBeNull();
  }));

it("refuses a session once its user is deactivated", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    const { token } = await open(user.id);
    await db.update(users).set({ active: false }).where(eq(users.id, user.id));
    await expect(readSession(token)).resolves.toBeNull();
  }));

it("slides lastUsedAt and, with remember, expiresAt", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    const { token } = await open(user.id, true);
    const id = hashToken(token);
    const old = new Date(Date.now() - 10 * 60_000);
    await db
      .update(sessions)
      .set({ lastUsedAt: old, expiresAt: new Date(Date.now() + HOUR) })
      .where(eq(sessions.id, id));

    await readSession(token);
    const [after] = await db.select().from(sessions).where(eq(sessions.id, id));
    expect(after.lastUsedAt.getTime()).toBeGreaterThan(old.getTime());
    expect(after.expiresAt.getTime() - Date.now()).toBeGreaterThan(
      29 * 24 * HOUR,
    );
  }));
