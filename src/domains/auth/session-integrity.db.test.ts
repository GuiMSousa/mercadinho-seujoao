import { eq } from "drizzle-orm";
import { expect, it, vi } from "vitest";
import { updateUserChecked } from "@/domains/users/repository";
import { sessions, users } from "@/infrastructure/db/schema";
import { withTestDb, type TestDb } from "@/infrastructure/db/test-db";
import { ServiceError } from "./errors";
import { createSession } from "./sessions";

vi.mock("server-only", () => ({}));

// The repositories reach the database through getDb(); point it at the test transaction.
let current: TestDb;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

const inTest = (fn: (db: TestDb) => Promise<void>) =>
  withTestDb(async (db) => {
    current = db;
    await fn(db);
  });

async function newUser(db: TestDb, email = "maria@loja.com") {
  const [user] = await db
    .insert(users)
    .values({ name: "Maria", email, role: "CASHIER", passwordHash: "hash-a" })
    .returning();
  return user;
}

const open = (userId: string, passwordHash?: string) =>
  createSession({
    userId,
    remember: false,
    userAgent: null,
    ip: "203.0.113.1",
    passwordHash,
  });

const sessionCount = async (db: TestDb) =>
  (await db.select().from(sessions)).length;

it("opens the session when the verified hash is still current", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    await open(user.id, "hash-a");
    expect(await sessionCount(db)).toBe(1);
  }));

it("refuses with 401 and stores nothing when the password changed after it was verified", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    // The reset commits between authenticate() and createSession().
    await db
      .update(users)
      .set({ passwordHash: "hash-b" })
      .where(eq(users.id, user.id));
    await expect(open(user.id, "hash-a")).rejects.toMatchObject({
      constructor: ServiceError,
      status: 401,
      message: "E-mail ou senha incorretos.",
    });
    expect(await sessionCount(db)).toBe(0);
  }));

it("refuses with 401 when the user was deactivated after the password was verified", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    await db.update(users).set({ active: false }).where(eq(users.id, user.id));
    await expect(open(user.id, "hash-a")).rejects.toMatchObject({
      status: 401,
    });
    expect(await sessionCount(db)).toBe(0);
  }));

it("opens a session without a verified hash (signup path)", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    await open(user.id);
    expect(await sessionCount(db)).toBe(1);
  }));

it("deactivating a user deletes their sessions in the same transaction", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    const other = await newUser(db, "joao@loja.com");
    await open(user.id);
    await open(user.id);
    await open(other.id);

    const updated = await updateUserChecked(
      user.id,
      { active: false },
      () => {},
    );

    expect(updated?.active).toBe(false);
    const left = await db.select().from(sessions);
    expect(left.map((s) => s.userId)).toEqual([other.id]);
  }));

it("keeps the sessions and the flag when the check refuses the deactivation", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    await open(user.id);

    await expect(
      updateUserChecked(user.id, { active: false }, () => {
        throw new ServiceError(409, "refused");
      }),
    ).rejects.toThrow("refused");

    expect(await sessionCount(db)).toBe(1);
    const [row] = await db.select().from(users).where(eq(users.id, user.id));
    expect(row.active).toBe(true);
  }));

it("does not touch sessions when the patch keeps the user active", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    await open(user.id);
    await updateUserChecked(user.id, { name: "Maria S." }, () => {});
    expect(await sessionCount(db)).toBe(1);
  }));
