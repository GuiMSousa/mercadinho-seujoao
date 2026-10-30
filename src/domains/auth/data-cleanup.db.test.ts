import { eq } from "drizzle-orm";
import { expect, it, vi } from "vitest";
import { createStoreWithAdmin } from "@/domains/store/repository";
import { sessions, users, verificationCodes } from "@/infrastructure/db/schema";
import { withTestDb, type TestDb } from "@/infrastructure/db/test-db";
import { createSession } from "./sessions";
import { insertCode } from "./verification-repository";

vi.mock("server-only", () => ({}));

// The repositories reach the database through getDb(); point it at the test transaction.
let current: TestDb;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

const HOUR = 3_600_000;

const inTest = (fn: (db: TestDb) => Promise<void>) =>
  withTestDb(async (db) => {
    current = db;
    await fn(db);
  });

const code = (
  email: string,
  purpose: "signup" | "password_reset",
  createdAt: Date,
  payload: unknown = null,
) => ({
  purpose,
  email,
  codeHash: "hash",
  expiresAt: new Date(Date.now() + HOUR),
  createdAt,
  payload,
});

it("creating the store clears the payload of every pending signup code, and only those", () =>
  inTest(async (db) => {
    const now = new Date();
    await db
      .insert(verificationCodes)
      .values([
        code("a@loja.com", "signup", now, { passwordHash: "x" }),
        code("b@loja.com", "signup", now, { passwordHash: "y" }),
        code("c@loja.com", "password_reset", now, { keep: true }),
      ]);
    const [used] = await db
      .select({ id: verificationCodes.id })
      .from(verificationCodes)
      .where(eq(verificationCodes.email, "a@loja.com"));

    await createStoreWithAdmin({
      codeId: used.id,
      store: { name: "Loja", document: "", phone: "", kind: "" },
      admin: { name: "Ana", email: "a@loja.com", passwordHash: "h" },
    });

    const rows = await db.select().from(verificationCodes);
    const byEmail = Object.fromEntries(rows.map((r) => [r.email, r.payload]));
    expect(byEmail["a@loja.com"]).toBeNull();
    expect(byEmail["b@loja.com"]).toBeNull();
    expect(byEmail["c@loja.com"]).toEqual({ keep: true });
  }));

it("createSession deletes the user's expired sessions but not live ones or other users'", () =>
  inTest(async (db) => {
    const [maria, joao] = await db
      .insert(users)
      .values([
        { name: "Maria", email: "maria@loja.com", role: "ADMIN" },
        { name: "Joao", email: "joao@loja.com", role: "ADMIN" },
      ])
      .returning();
    const session = (id: string, userId: string, expiresAt: Date) => ({
      id,
      userId,
      csrfHash: "c",
      expiresAt,
    });
    await db
      .insert(sessions)
      .values([
        session("old-maria", maria.id, new Date(Date.now() - HOUR)),
        session("live-maria", maria.id, new Date(Date.now() + HOUR)),
        session("old-joao", joao.id, new Date(Date.now() - HOUR)),
      ]);

    await createSession({
      userId: maria.id,
      remember: false,
      userAgent: null,
      ip: "203.0.113.1",
    });

    const ids = (await db.select({ id: sessions.id }).from(sessions)).map(
      (r) => r.id,
    );
    expect(ids).not.toContain("old-maria");
    expect(ids).toEqual(expect.arrayContaining(["live-maria", "old-joao"]));
    expect(ids).toHaveLength(3);
  }));

it("insertCode drops codes of the same e-mail and purpose older than 25 h, keeping the rest", () =>
  inTest(async (db) => {
    const ago = (hours: number) => new Date(Date.now() - hours * HOUR);
    await db
      .insert(verificationCodes)
      .values([
        code("a@loja.com", "password_reset", ago(26)),
        code("a@loja.com", "password_reset", ago(24)),
        code("a@loja.com", "signup", ago(26)),
        code("b@loja.com", "password_reset", ago(26)),
      ]);

    await insertCode({
      purpose: "password_reset",
      email: "a@loja.com",
      codeHash: "new",
      expiresAt: new Date(Date.now() + HOUR),
      payload: null,
    });

    const rows = await db.select().from(verificationCodes);
    // Left: the 24 h one, the new one, the other purpose and the other e-mail.
    expect(rows).toHaveLength(4);
    expect(
      rows.filter(
        (r) => r.email === "a@loja.com" && r.purpose === "password_reset",
      ),
    ).toHaveLength(2);
  }));
