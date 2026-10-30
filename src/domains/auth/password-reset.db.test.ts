import { eq } from "drizzle-orm";
import { beforeEach, expect, it, vi } from "vitest";
import {
  activityLog,
  sessions,
  users,
  verificationCodes,
} from "@/infrastructure/db/schema";
import { withTestDb, type TestDb } from "@/infrastructure/db/test-db";
import { getMailer } from "@/infrastructure/mail";
import { INVITE_TTL_MS } from "./codes";
import { ServiceError } from "./errors";
import { hashPassword, verifyPassword } from "./password";
import { confirmPasswordReset, requestPasswordReset } from "./password-reset";
import { deliverCode } from "./verification";

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

const sentCode = () => /\d{6}/.exec(send.mock.calls.at(-1)![0].text)![0];
const wrongCode = (right: string) => (right === "000000" ? "111111" : "000000");

const failure = async (promise: Promise<unknown>) => {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ServiceError);
  return error as ServiceError;
};

async function newUser(
  db: TestDb,
  overrides: Partial<typeof users.$inferInsert> = {},
) {
  const [user] = await db
    .insert(users)
    .values({
      name: "Ana Souza",
      email: "ana@loja.com",
      role: "ADMIN",
      passwordHash: await hashPassword("antiga1234"),
      ...overrides,
    })
    .returning();
  return user;
}

it("silent for unknown and inactive e-mails, mails a code to an active account", () =>
  inTest(async (db) => {
    await newUser(db, { email: "off@loja.com", active: false });
    await requestPasswordReset("nobody@loja.com");
    await requestPasswordReset("off@loja.com");
    expect(await db.select().from(verificationCodes)).toHaveLength(0);

    await newUser(db);
    await requestPasswordReset("ana@loja.com");
    await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
    expect(send.mock.calls[0][0]).toMatchObject({ to: "ana@loja.com" });
    const [row] = await db.select().from(verificationCodes);
    expect(row.purpose).toBe("password_reset");

    // Within the minute: no error and no second mail.
    await requestPasswordReset("ana@loja.com");
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(send).toHaveBeenCalledOnce();
  }));

it("confirming changes the password, consumes the code and ends every session", () =>
  inTest(async (db) => {
    const user = await newUser(db);
    await db.insert(sessions).values({
      id: "s1",
      userId: user.id,
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    await requestPasswordReset("ana@loja.com");
    await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
    const code = sentCode();

    await confirmPasswordReset("ana@loja.com", code, "nova12345");
    const [after] = await db.select().from(users);
    await expect(
      verifyPassword("nova12345", after.passwordHash!),
    ).resolves.toBe(true);
    expect(after.passwordChangedAt).not.toBeNull();
    expect(await db.select().from(sessions)).toHaveLength(0);
    const [stored] = await db.select().from(verificationCodes);
    expect(stored.consumedAt).not.toBeNull();
    const [entry] = await db.select().from(activityLog);
    expect(entry).toMatchObject({
      action: "Senha redefinida",
      userId: user.id,
    });

    const reuse = await failure(
      confirmPasswordReset("ana@loja.com", code, "outra12345"),
    );
    expect(reuse.status).toBe(422);
  }));

it("every failure reads the same, and an invited user can set a first password", () =>
  inTest(async (db) => {
    await newUser(db, { passwordHash: null });
    await requestPasswordReset("ana@loja.com");
    await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
    const code = sentCode();

    const messages = [
      await failure(
        confirmPasswordReset("ana@loja.com", wrongCode(code), "nova12345"),
      ),
      await failure(confirmPasswordReset("nobody@loja.com", code, "nova12345")),
    ].map((e) => e.message);
    expect(new Set(messages).size).toBe(1);

    await confirmPasswordReset("ana@loja.com", code, "nova12345");
    const [after] = await db.select().from(users);
    await expect(
      verifyPassword("nova12345", after.passwordHash!),
    ).resolves.toBe(true);
  }));

it("an invite code older than the resend interval still works when no new reset was requested", () =>
  inTest(async (db) => {
    await newUser(db, { passwordHash: null });
    await deliverCode("password_reset", "ana@loja.com", undefined, {
      ttlMs: INVITE_TTL_MS,
    });
    const code = sentCode();
    await db
      .update(verificationCodes)
      .set({ createdAt: new Date(Date.now() - 5 * 60_000) })
      .where(eq(verificationCodes.email, "ana@loja.com"));

    await confirmPasswordReset("ana@loja.com", code, "nova12345");
    const [after] = await db
      .select()
      .from(users)
      .where(eq(users.email, "ana@loja.com"));
    await expect(
      verifyPassword("nova12345", after.passwordHash!),
    ).resolves.toBe(true);
  }));

it("stays silent and sends nothing once 10 codes were issued in 24 h", () =>
  inTest(async (db) => {
    await newUser(db);
    await db.insert(verificationCodes).values(
      Array.from({ length: 10 }, () => ({
        purpose: "password_reset" as const,
        email: "ana@loja.com",
        codeHash: "h",
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(Date.now() - 3_600_000),
      })),
    );
    await expect(requestPasswordReset("ana@loja.com")).resolves.toBeUndefined();
    // Delivery is detached; give it time to (not) run.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(send).not.toHaveBeenCalled();
    expect(await db.select().from(verificationCodes)).toHaveLength(10);
  }));
