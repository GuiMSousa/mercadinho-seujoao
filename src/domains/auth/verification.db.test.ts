import { and, eq, isNull } from "drizzle-orm";
import { beforeEach, expect, it, vi } from "vitest";
import { createStoreWithAdmin } from "@/domains/store/repository";
import { verificationCodes } from "@/infrastructure/db/schema";
import { withTestDb, type TestDb } from "@/infrastructure/db/test-db";
import { getMailer } from "@/infrastructure/mail";
import { ServiceError } from "./errors";
import {
  assertCooldown,
  DAILY_CODE_CAP,
  deliverCode,
  issueCode,
} from "./verification";
import { supersedeCodes } from "./verification-repository";

vi.mock("server-only", () => ({}));

// The repositories reach the database through getDb(); point it at the test transaction.
let current: TestDb;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));
vi.mock("@/infrastructure/mail", () => ({ getMailer: vi.fn() }));

const send = vi.fn();
beforeEach(() => {
  send.mockReset().mockResolvedValue(undefined);
  vi.mocked(getMailer).mockReturnValue({ send });
});

const inTest = (fn: (db: TestDb) => Promise<void>) =>
  withTestDb(async (db) => {
    current = db;
    await fn(db);
  });

const EMAIL = "ana@loja.com";
const open = (db: TestDb) =>
  db
    .select()
    .from(verificationCodes)
    .where(isNull(verificationCodes.consumedAt));

function insertAged(db: TestDb, count: number, ageMs: number, email = EMAIL) {
  const createdAt = new Date(Date.now() - ageMs);
  return db.insert(verificationCodes).values(
    Array.from({ length: count }, () => ({
      purpose: "password_reset" as const,
      email,
      codeHash: "h",
      expiresAt: new Date(Date.now() + 60_000),
      createdAt,
    })),
  );
}

it("refuses an 11th code within 24 h with 429 and a Retry-After, per e-mail and purpose", () =>
  inTest(async (db) => {
    await insertAged(db, DAILY_CODE_CAP, 2 * 3_600_000);
    const error = await assertCooldown("password_reset", EMAIL).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ServiceError);
    expect((error as ServiceError).status).toBe(429);
    // The oldest code was issued 2 h ago, so the window reopens in about 22 h.
    expect((error as ServiceError).options.retryAfterSeconds).toBeGreaterThan(
      21 * 3600,
    );
    await expect(assertCooldown("signup", EMAIL)).resolves.toBeUndefined();
    await expect(
      assertCooldown("password_reset", "other@loja.com"),
    ).resolves.toBeUndefined();
  }));

it("allows another code once the old ones leave the 24 h window or stay under the cap", () =>
  inTest(async (db) => {
    await insertAged(db, DAILY_CODE_CAP, 25 * 3_600_000);
    await expect(
      assertCooldown("password_reset", EMAIL),
    ).resolves.toBeUndefined();
    await insertAged(db, DAILY_CODE_CAP - 1, 2 * 3_600_000, "b@loja.com");
    await expect(
      assertCooldown("password_reset", "b@loja.com"),
    ).resolves.toBeUndefined();
  }));

it("supersedes only older codes, so of two deliveries the newest survives whatever the order", () =>
  inTest(async (db) => {
    const older = await issueCode("password_reset", EMAIL);
    await new Promise((resolve) => setTimeout(resolve, 5));
    const newer = await issueCode("password_reset", EMAIL);
    // The older delivery finishes last and tries to supersede: the newer code must stay open.
    await supersedeCodes("password_reset", EMAIL, older.id);
    expect((await open(db)).map((row) => row.id).sort()).toEqual(
      [older.id, newer.id].sort(),
    );
    await supersedeCodes("password_reset", EMAIL, newer.id);
    expect((await open(db)).map((row) => row.id)).toEqual([newer.id]);
  }));

it("drops the payload of a superseded code", () =>
  inTest(async (db) => {
    await deliverCode("signup", EMAIL, { passwordHash: "secret-hash" });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await deliverCode("signup", EMAIL, { passwordHash: "secret-hash" });
    const rows = await db
      .select()
      .from(verificationCodes)
      .where(and(eq(verificationCodes.email, EMAIL)));
    const [kept] = rows.filter((row) => !row.consumedAt);
    expect(kept.payload).toEqual({ passwordHash: "secret-hash" });
    expect(
      rows.filter((row) => row.consumedAt).map((row) => row.payload),
    ).toEqual([null]);
  }));

it("drops the payload when the signup code is consumed", () =>
  inTest(async (db) => {
    const { id } = await issueCode("signup", EMAIL, {
      payload: { passwordHash: "secret-hash", nonceHash: "n" },
    });
    await createStoreWithAdmin({
      codeId: id,
      store: { name: "Loja", document: "1", phone: "", kind: "Mercadinho" },
      admin: { name: "Ana", email: EMAIL, passwordHash: "h" },
    });
    const [row] = await db
      .select()
      .from(verificationCodes)
      .where(eq(verificationCodes.id, id));
    expect(row.consumedAt).not.toBeNull();
    expect(row.payload).toBeNull();
  }));
