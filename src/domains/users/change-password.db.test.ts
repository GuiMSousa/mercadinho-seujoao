import { eq } from "drizzle-orm";
import { expect, it, vi } from "vitest";
import { hashPassword, verifyPassword } from "@/domains/auth/password";
import { sessions, users, verificationCodes } from "@/infrastructure/db/schema";
import { withTestDb, type TestDb } from "@/infrastructure/db/test-db";
import { changePassword } from "./service";

vi.mock("server-only", () => ({}));

// The repositories reach the database through getDb(); point it at the test transaction.
let current: TestDb;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

const inTest = (fn: (db: TestDb) => Promise<void>) =>
  withTestDb(async (db) => {
    current = db;
    await fn(db);
  });

const code = (email: string, purpose: "password_reset" | "signup") => ({
  purpose,
  email,
  codeHash: "h",
  expiresAt: new Date(Date.now() + 60_000),
  payload: { secret: "x" },
});

it("sets the hash, ends the other sessions and consumes the open reset codes of the e-mail in one step", () =>
  inTest(async (db) => {
    const [admin] = await db
      .insert(users)
      .values({
        name: "Ana",
        email: "ana@loja.com",
        role: "ADMIN",
        passwordHash: await hashPassword("antiga1234"),
      })
      .returning();
    const expiresAt = new Date(Date.now() + 3_600_000);
    await db.insert(sessions).values([
      { id: "here", userId: admin.id, expiresAt },
      { id: "elsewhere", userId: admin.id, expiresAt },
    ]);
    await db
      .insert(verificationCodes)
      .values([
        code("ana@loja.com", "password_reset"),
        code("ana@loja.com", "signup"),
        code("outra@loja.com", "password_reset"),
      ]);

    await changePassword(
      { id: "here", user: { ...admin, role: "ADMIN" } },
      "antiga1234",
      "nova123456",
    );

    const [stored] = await db
      .select()
      .from(users)
      .where(eq(users.id, admin.id));
    expect(await verifyPassword("nova123456", stored.passwordHash!)).toBe(true);
    expect(stored.passwordChangedAt).toBeInstanceOf(Date);
    expect((await db.select().from(sessions)).map((s) => s.id)).toEqual([
      "here",
    ]);
    const consumed = Object.fromEntries(
      (await db.select().from(verificationCodes)).map((row) => [
        `${row.email}/${row.purpose}`,
        row.consumedAt !== null,
      ]),
    );
    expect(consumed).toEqual({
      "ana@loja.com/password_reset": true,
      "ana@loja.com/signup": false,
      "outra@loja.com/password_reset": false,
    });
  }));
