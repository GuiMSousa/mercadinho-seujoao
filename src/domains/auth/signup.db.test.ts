import { randomUUID } from "node:crypto";
import { eq, isNull } from "drizzle-orm";
import { beforeEach, expect, it, vi } from "vitest";
import { storeExists } from "@/domains/store/repository";
import { hasStore } from "@/domains/store/service";
import {
  activityLog,
  stores,
  users,
  verificationCodes,
} from "@/infrastructure/db/schema";
import {
  withTestDb,
  withTestPool,
  type TestDb,
} from "@/infrastructure/db/test-db";
import { getMailer } from "@/infrastructure/mail";
import { MAX_ATTEMPTS } from "./codes";
import { ServiceError } from "./errors";
import { hashPassword, verifyPassword } from "./password";
import { completeSignup, resendSignupCode, startSignup } from "./signup";

vi.mock("server-only", () => ({}));

// The repositories reach the database through getDb(); point it at the test transaction.
let current: TestDb;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));
vi.mock("@/infrastructure/mail", () => ({ getMailer: vi.fn() }));
vi.mock("@/domains/store/service", () => ({ hasStore: vi.fn() }));

const send = vi.fn();
// Nonce the browser would hold in its cookie after the last startSignup.
let nonce: string | undefined;
beforeEach(() => {
  send.mockReset().mockResolvedValue(undefined);
  vi.mocked(getMailer).mockReturnValue({ send });
  vi.mocked(hasStore).mockImplementation(storeExists);
});

const inTest = (fn: (db: TestDb) => Promise<void>) =>
  withTestDb(async (db) => {
    current = db;
    await fn(db);
  });

const request = (email = "ana@loja.com") => ({
  name: "Ana Souza",
  email,
  password: "senha1234",
  storeName: "Mercadinho da Ana",
  document: "12345678000190",
  phone: "(11) 99999-0000",
  kind: "Mercadinho" as const,
  terms: true as const,
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

// Makes every code look `ms` old, to get past the resend cooldown.
const age = (db: TestDb, ms: number) =>
  db
    .update(verificationCodes)
    .set({ createdAt: new Date(Date.now() - ms) })
    .where(eq(verificationCodes.email, "ana@loja.com"));

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

it("startSignup mails a code and keeps the request, with the password only hashed", () =>
  inTest(async (db) => {
    nonce = await startSignup(request());
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0]).toMatchObject({ to: "ana@loja.com" });
    const [row] = await db.select().from(verificationCodes);
    expect(row).toMatchObject({
      purpose: "signup",
      email: "ana@loja.com",
      attempts: 0,
      consumedAt: null,
    });
    expect(row.codeHash).not.toContain(sentCode());
    expect(JSON.stringify(row.payload)).not.toContain("senha1234");
    expect(row.payload).toMatchObject({
      name: "Ana Souza",
      storeName: "Mercadinho da Ana",
      document: "12345678000190",
    });
    const ttl = row.expiresAt.getTime() - Date.now();
    expect(Math.abs(ttl - 10 * 60_000)).toBeLessThan(5_000);
  }));

it("completeSignup creates the store and its ADMIN, consumes the code and logs the account", () =>
  inTest(async (db) => {
    nonce = await startSignup(request());
    const user = await completeSignup("ana@loja.com", sentCode(), nonce);
    expect(user).toMatchObject({
      name: "Ana Souza",
      email: "ana@loja.com",
      role: "ADMIN",
    });
    const [store] = await db.select().from(stores);
    expect(store).toMatchObject({
      name: "Mercadinho da Ana",
      document: "12345678000190",
      phone: "(11) 99999-0000",
      kind: "Mercadinho",
      sessionIdle: "8h",
    });
    const [stored] = await db.select().from(users);
    expect(stored.role).toBe("ADMIN");
    await expect(
      verifyPassword("senha1234", stored.passwordHash!),
    ).resolves.toBe(true);
    const [code] = await db.select().from(verificationCodes);
    expect(code.consumedAt).not.toBeNull();
    const [entry] = await db.select().from(activityLog);
    expect(entry).toMatchObject({ action: "Conta criada", userId: user.id });
  }));

it("refuses a second account once a store exists and keeps a single store", () =>
  inTest(async (db) => {
    nonce = await startSignup(request("ana@loja.com"));
    await completeSignup("ana@loja.com", sentCode(), nonce);

    const other = await failure(startSignup(request("bia@loja.com")));
    expect(other).toMatchObject({
      status: 409,
      message: "A loja já foi criada. Entre com sua conta.",
    });
    expect(await db.select().from(stores)).toHaveLength(1);
  }));

it("maps the stores.singleton violation of a concurrent signup to the same 409", () =>
  inTest(async (db) => {
    nonce = await startSignup(request("bia@loja.com"));
    const code = sentCode();
    // Another signup finished between the check and the insert.
    await db.insert(stores).values({ name: "Outra", document: "1" });
    vi.mocked(hasStore).mockResolvedValue(false);

    const error = await failure(completeSignup("bia@loja.com", code, nonce));
    expect(error).toMatchObject({
      status: 409,
      message: "A loja já foi criada. Entre com sua conta.",
    });
    expect(await db.select().from(stores)).toHaveLength(1);
    expect(await db.select().from(users)).toHaveLength(0);
    // The transaction rolled back, so the code was not burned.
    const [row] = await db.select().from(verificationCodes);
    expect(row.consumedAt).toBeNull();
  }));

it("refuses an e-mail that already has an account", () =>
  inTest(async (db) => {
    await newUser(db, { role: "CASHIER" });
    const error = await failure(startSignup(request()));
    expect(error).toMatchObject({
      status: 409,
      message: "Este e-mail já tem conta. Entre ou recupere a senha.",
    });
    expect(send).not.toHaveBeenCalled();
  }));

it("maps a users.email violation at confirmation time to 409", () =>
  inTest(async (db) => {
    nonce = await startSignup(request());
    const code = sentCode();
    await newUser(db, { role: "CASHIER" });
    const error = await failure(completeSignup("ana@loja.com", code, nonce));
    expect(error.status).toBe(409);
    expect(await db.select().from(stores)).toHaveLength(0);
  }));

it("locks the code after five wrong guesses, even when they arrive in parallel", async () => {
  // Needs real concurrent connections, so it commits and cleans up after itself.
  const email = `parallel-guess-${randomUUID()}@loja.com`;
  await withTestPool(async (db) => {
    current = db as unknown as TestDb;
    try {
      nonce = await startSignup(request(email));
      const right = sentCode();
      const results = await Promise.all(
        Array.from({ length: 8 }, () =>
          completeSignup(email, wrongCode(right), nonce).catch(
            (e: ServiceError) => e.message,
          ),
        ),
      );
      expect(
        results.filter((m) => /^Código incorreto/.test(String(m))),
      ).toHaveLength(MAX_ATTEMPTS);
      expect(
        results.filter((m) => /^Muitas tentativas/.test(String(m))),
      ).toHaveLength(3);
      const [row] = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.email, email));
      expect(row.attempts).toBe(MAX_ATTEMPTS);

      const late = await failure(completeSignup(email, right, nonce));
      expect(late.options.fields?.code).toMatch(/^Muitas tentativas/);
      expect(await db.select().from(stores)).toHaveLength(0);
    } finally {
      await db
        .delete(verificationCodes)
        .where(eq(verificationCodes.email, email));
    }
  });
});

it("reports a wrong code on the code field and still accepts the right one", () =>
  inTest(async (db) => {
    nonce = await startSignup(request());
    const right = sentCode();
    const error = await failure(
      completeSignup("ana@loja.com", wrongCode(right), nonce),
    );
    expect(error).toMatchObject({
      status: 422,
      options: { fields: { code: expect.stringMatching(/^Código incorreto/) } },
    });
    await expect(
      completeSignup("ana@loja.com", right, nonce),
    ).resolves.toMatchObject({
      role: "ADMIN",
    });
    expect(await db.select().from(stores)).toHaveLength(1);
  }));

it("rejects an expired code, an unknown e-mail and a reused code", () =>
  inTest(async (db) => {
    nonce = await startSignup(request());
    const code = sentCode();
    await db
      .update(verificationCodes)
      .set({ expiresAt: new Date(Date.now() - 1_000) })
      .where(eq(verificationCodes.email, "ana@loja.com"));
    expect(
      (await failure(completeSignup("ana@loja.com", code, nonce))).message,
    ).toBe("O código expirou. Peça um novo código.");
    expect(
      (await failure(completeSignup("zed@loja.com", code, nonce))).status,
    ).toBe(422);
    await db
      .update(verificationCodes)
      .set({ expiresAt: new Date(Date.now() + 60_000) })
      .where(eq(verificationCodes.email, "ana@loja.com"));
    await completeSignup("ana@loja.com", code, nonce);
    await db.delete(stores).where(eq(stores.singleton, true));
    expect(
      (await failure(completeSignup("ana@loja.com", code, nonce))).message,
    ).toBe("Código inválido. Peça um novo código.");
  }));

it("limits new codes to one a minute and a new code replaces the previous one", () =>
  inTest(async (db) => {
    nonce = await startSignup(request());
    const first = sentCode();
    const tooSoon = await failure(resendSignupCode("ana@loja.com", nonce));
    expect(tooSoon.status).toBe(429);
    expect(tooSoon.options.retryAfterSeconds).toBeGreaterThan(0);
    expect((await failure(startSignup(request()))).status).toBe(429);
    expect(send).toHaveBeenCalledOnce();

    await age(db, 61_000);
    await resendSignupCode("ana@loja.com", nonce);
    expect(send).toHaveBeenCalledTimes(2);
    const second = sentCode();

    const rows = await db.select().from(verificationCodes);
    expect(rows.filter((r) => r.consumedAt === null)).toHaveLength(1);
    // Codes are random: only assert the old one is dead when it differs from the new one.
    if (first !== second)
      expect(
        (await failure(completeSignup("ana@loja.com", first, nonce))).status,
      ).toBe(422);
    await expect(
      completeSignup("ana@loja.com", second, nonce),
    ).resolves.toMatchObject({ email: "ana@loja.com" });
  }));

it("answers 404 when there is nothing to resend", () =>
  inTest(async () => {
    expect(
      (await failure(resendSignupCode("ana@loja.com", nonce))).status,
    ).toBe(404);
  }));

it("drops the code when the mail cannot be delivered, so the person can retry at once", () =>
  inTest(async (db) => {
    send.mockRejectedValueOnce(new Error("mail delivery failed: 500"));
    await expect(startSignup(request())).rejects.toThrow(
      "mail delivery failed",
    );
    expect(
      await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.email, "ana@loja.com")),
    ).toHaveLength(0);
    await expect(startSignup(request())).resolves.toEqual(expect.any(String));
  }));

it("binds a pending signup to the browser that started it", () =>
  inTest(async (db) => {
    nonce = await startSignup(request());
    const ownerNonce = nonce;
    await age(db, 61_000);
    // A stranger restarts the signup for the same e-mail with their own password.
    nonce = await startSignup({ ...request(), password: "atacante123" });
    const attackerCode = sentCode();

    // The owner's old cookie fails on resend and verify, and no attempt is spent.
    for (const attempt of [
      () => resendSignupCode("ana@loja.com", ownerNonce),
      () => completeSignup("ana@loja.com", attackerCode, ownerNonce),
      () => completeSignup("ana@loja.com", attackerCode, undefined),
      () => resendSignupCode("ana@loja.com", undefined),
    ]) {
      expect(await failure(attempt())).toMatchObject({
        status: 409,
        message: "Seu cadastro expirou. Comece de novo.",
      });
    }
    const [open] = await db
      .select()
      .from(verificationCodes)
      .where(isNull(verificationCodes.consumedAt));
    expect(open.attempts).toBe(0);
    expect(await db.select().from(users)).toHaveLength(0);

    // The owner starts over and gets their own account.
    await age(db, 61_000);
    nonce = await startSignup(request());
    await completeSignup("ana@loja.com", sentCode(), nonce);
    const [created] = await db.select().from(users);
    await expect(
      verifyPassword("senha1234", created.passwordHash!),
    ).resolves.toBe(true);
  }));

it("keeps the previous code valid when the new one cannot be delivered", () =>
  inTest(async (db) => {
    nonce = await startSignup(request());
    const first = sentCode();
    await age(db, 61_000);
    send.mockRejectedValueOnce(new Error("mail delivery failed: 500"));
    await expect(resendSignupCode("ana@loja.com", nonce)).rejects.toThrow();
    await expect(
      completeSignup("ana@loja.com", first, nonce),
    ).resolves.toMatchObject({ role: "ADMIN" });
  }));
