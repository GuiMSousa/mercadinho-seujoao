import { eq } from "drizzle-orm";
import { expect, it } from "vitest";
import {
  activityLog,
  sessions,
  stores,
  users,
  verificationCodes,
} from "@/infrastructure/db/schema";
import { withTestDb, type TestDb } from "./test-db";

const hour = () => new Date(Date.now() + 3_600_000);

// Drizzle wraps the driver error; the pg error (code, constraint) is its cause.
async function pgError(run: (db: TestDb) => Promise<unknown>, db: TestDb) {
  try {
    await db.transaction(run);
  } catch (error) {
    return (error as { cause?: { code?: string; constraint?: string } }).cause;
  }
  throw new Error("expected the statement to fail");
}

const newStore = { name: "Mercadinho", document: "12345678000190" };

it("stores, users, sessions, codes and activity round-trip with their defaults", () =>
  withTestDb(async (db) => {
    const [store] = await db.insert(stores).values(newStore).returning();
    expect(store).toMatchObject({ address: "", sessionIdle: "8h" });

    const [user] = await db
      .insert(users)
      .values({ name: "Maria", email: "maria@example.com", role: "ADMIN" })
      .returning();
    expect(user).toMatchObject({ active: true, passwordHash: null });

    const [session] = await db
      .insert(sessions)
      .values({ id: "a".repeat(64), userId: user.id, expiresAt: hour() })
      .returning();
    expect(session.remember).toBe(false);

    const [code] = await db
      .insert(verificationCodes)
      .values({
        purpose: "signup",
        email: user.email,
        codeHash: "hash",
        expiresAt: hour(),
        payload: { name: "Maria" },
      })
      .returning();
    expect(code.attempts).toBe(0);

    const [entry] = await db
      .insert(activityLog)
      .values({ userId: user.id, userName: user.name, action: "login" })
      .returning();
    expect(entry.detail).toBe("");
  }));

it("allows only one store", () =>
  withTestDb(async (db) => {
    await db.insert(stores).values(newStore);
    const error = await pgError(
      (tx) => tx.insert(stores).values({ name: "Outra" }),
      db,
    );
    expect(error).toMatchObject({
      code: "23505",
      constraint: "stores_singleton",
    });
  }));

it("rejects two users with the same e-mail", () =>
  withTestDb(async (db) => {
    const values = {
      name: "Maria",
      email: "maria@example.com",
      role: "CASHIER",
    } as const;
    await db.insert(users).values(values);
    const error = await pgError((tx) => tx.insert(users).values(values), db);
    expect(error).toMatchObject({ code: "23505" });
  }));

it("deleting a user deletes their sessions and keeps the activity log with a null user", () =>
  withTestDb(async (db) => {
    const [user] = await db
      .insert(users)
      .values({ name: "Maria", email: "maria@example.com", role: "CASHIER" })
      .returning();
    await db
      .insert(sessions)
      .values({ id: "b".repeat(64), userId: user.id, expiresAt: hour() });
    await db
      .insert(activityLog)
      .values({ userId: user.id, userName: user.name, action: "login" });

    await db.delete(users).where(eq(users.id, user.id));

    expect(await db.select().from(sessions)).toHaveLength(0);
    const [entry] = await db.select().from(activityLog);
    expect(entry).toMatchObject({ userId: null, userName: "Maria" });
  }));
