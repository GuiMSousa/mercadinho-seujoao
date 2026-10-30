import { eq } from "drizzle-orm";
import { beforeEach, expect, it, vi } from "vitest";
import { INVITE_TTL_MS } from "@/domains/auth/codes";
import { ServiceError } from "@/domains/auth/errors";
import { hashPassword, verifyPassword } from "@/domains/auth/password";
import { confirmPasswordReset } from "@/domains/auth/password-reset";
import { getStore, updateStore } from "@/domains/store/service";
import {
  activityLog,
  sessions,
  stores,
  users,
  verificationCodes,
} from "@/infrastructure/db/schema";
import { withTestDb, type TestDb } from "@/infrastructure/db/test-db";
import { getMailer } from "@/infrastructure/mail";
import {
  changePassword,
  endOtherSessions,
  inviteUser,
  listUsers,
  updateUser,
} from "./service";

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

const newSession = async (db: TestDb, userId: string, id: string) => {
  await db.insert(sessions).values({
    id,
    userId,
    expiresAt: new Date(Date.now() + 3_600_000),
  });
};

const newStore = (db: TestDb) =>
  db.insert(stores).values({ name: "Mercadinho do João" });

const activityOf = async (db: TestDb) =>
  (await db.select().from(activityLog)).map((r) => [r.action, r.detail]);

const MISSING_ID = "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b";

it("lists users with pending, last login and active flags", async () => {
  await inTest(async (db) => {
    await newUser(db, { lastLoginAt: new Date("2026-01-02T03:04:05.000Z") });
    await newUser(db, {
      name: "Bia Convidada",
      email: "bia@loja.com",
      role: "CASHIER",
      passwordHash: null,
      active: false,
    });
    expect(await listUsers()).toMatchObject([
      {
        name: "Ana Souza",
        lastLoginAt: "2026-01-02T03:04:05.000Z",
        pending: false,
        active: true,
      },
      {
        name: "Bia Convidada",
        lastLoginAt: null,
        pending: true,
        active: false,
        role: "CASHIER",
      },
    ]);
  });
});

it("invites a user without password and mails a 48 h code that sets the password", async () => {
  await inTest(async (db) => {
    const admin = await newUser(db);
    await newStore(db);
    const row = await inviteUser(admin, {
      name: "Caio Caixa",
      email: "caio@loja.com",
      role: "CASHIER",
    });
    expect(row).toMatchObject({
      email: "caio@loja.com",
      role: "CASHIER",
      active: true,
      pending: true,
      lastLoginAt: null,
    });
    const [mail] = send.mock.calls[0]!;
    expect(mail.to).toBe("caio@loja.com");
    expect(mail.text).toContain("Mercadinho do João");
    const [code] = await db.select().from(verificationCodes);
    expect(code).toMatchObject({
      purpose: "password_reset",
      email: "caio@loja.com",
    });
    expect(
      Math.abs(code!.expiresAt.getTime() - Date.now() - INVITE_TTL_MS),
    ).toBeLessThan(60_000);
    expect(await activityOf(db)).toContainEqual([
      "Usuário adicionado",
      "caio@loja.com",
    ]);

    // The code from the mail is the one the reset screen accepts.
    const sent = /\d{6}/.exec(mail.text)![0];
    await confirmPasswordReset("caio@loja.com", sent, "senha12345");
    const [stored] = await db
      .select()
      .from(users)
      .where(eq(users.email, "caio@loja.com"));
    expect(await verifyPassword("senha12345", stored!.passwordHash!)).toBe(
      true,
    );
  });
});

it("refuses an invite for an e-mail that already has an account with 409", async () => {
  await inTest(async (db) => {
    const admin = await newUser(db);
    await newStore(db);
    const error = await failure(
      inviteUser(admin, {
        name: "Outra",
        email: "ana@loja.com",
        role: "ADMIN",
      }),
    );
    expect(error.status).toBe(409);
    expect(error.options.fields?.email).toBeTruthy();
    expect(send).not.toHaveBeenCalled();
  });
});

it("drops the new user when the invite mail cannot be delivered", async () => {
  await inTest(async (db) => {
    const admin = await newUser(db);
    await newStore(db);
    send.mockRejectedValue(new Error("mail down"));
    await expect(
      inviteUser(admin, {
        name: "Caio Caixa",
        email: "caio@loja.com",
        role: "CASHIER",
      }),
    ).rejects.toThrow("mail down");
    expect(await db.select().from(users)).toHaveLength(1);
    expect(await db.select().from(verificationCodes)).toHaveLength(0);
  });
});

it("refuses to demote or deactivate the last active ADMIN, even oneself", async () => {
  await inTest(async (db) => {
    const admin = await newUser(db);
    const other = await newUser(db, {
      name: "Caio",
      email: "caio@loja.com",
      role: "CASHIER",
    });
    const demote = await failure(
      updateUser(other, admin.id, { role: "CASHIER" }),
    );
    expect(demote).toMatchObject({
      status: 409,
      message: "Mantenha ao menos um administrador ativo.",
    });
    const deactivate = await failure(
      updateUser(other, admin.id, { active: false }),
    );
    expect(deactivate.message).toBe(
      "Mantenha ao menos um administrador ativo.",
    );
    const self = await failure(
      updateUser(admin, admin.id, { role: "CASHIER" }),
    );
    expect(self.status).toBe(409);
    const [stored] = await db
      .select()
      .from(users)
      .where(eq(users.id, admin.id));
    expect(stored).toMatchObject({ role: "ADMIN", active: true });
  });
});

it("demotes an ADMIN once another active ADMIN exists, but never lets one deactivate oneself", async () => {
  await inTest(async (db) => {
    const admin = await newUser(db);
    const second = await newUser(db, { name: "Dora", email: "dora@loja.com" });
    const selfOff = await failure(
      updateUser(admin, admin.id, { active: false }),
    );
    expect(selfOff.message).toBe("Você não pode desativar o próprio acesso.");
    expect(
      await updateUser(admin, second.id, { role: "CASHIER" }),
    ).toMatchObject({ role: "CASHIER" });
  });
});

it("deactivating revokes every session of the user and logs it", async () => {
  await inTest(async (db) => {
    const admin = await newUser(db);
    const target = await newUser(db, { name: "Caio", email: "caio@loja.com" });
    await newSession(db, target.id, "s1");
    await newSession(db, target.id, "s2");
    await newSession(db, admin.id, "s3");
    const row = await updateUser(admin, target.id, { active: false });
    expect(row.active).toBe(false);
    expect((await db.select().from(sessions)).map((s) => s.id)).toEqual(["s3"]);
    expect(await activityOf(db)).toContainEqual([
      "Usuário desativado",
      "caio@loja.com",
    ]);
  });
});

it("renames and changes the role logging 'Usuário alterado', and answers 404 for an unknown id", async () => {
  await inTest(async (db) => {
    const admin = await newUser(db);
    const target = await newUser(db, {
      name: "Caio",
      email: "caio@loja.com",
      role: "CASHIER",
    });
    expect(
      await updateUser(admin, target.id, { name: "Caio Souza" }),
    ).toMatchObject({ name: "Caio Souza", role: "CASHIER" });
    expect(await activityOf(db)).toContainEqual([
      "Usuário alterado",
      "caio@loja.com",
    ]);
    const missing = await failure(updateUser(admin, MISSING_ID, { name: "X" }));
    expect(missing.status).toBe(404);
  });
});

it("changes the password, ends the other sessions and keeps the current one", async () => {
  await inTest(async (db) => {
    const admin = await newUser(db);
    await newSession(db, admin.id, "here");
    await newSession(db, admin.id, "elsewhere");
    await changePassword(
      { id: "here", user: admin },
      "antiga1234",
      "nova123456",
    );
    const [stored] = await db
      .select()
      .from(users)
      .where(eq(users.id, admin.id));
    expect(await verifyPassword("nova123456", stored!.passwordHash!)).toBe(
      true,
    );
    expect(stored!.passwordChangedAt).toBeInstanceOf(Date);
    expect((await db.select().from(sessions)).map((s) => s.id)).toEqual([
      "here",
    ]);
    expect((await activityOf(db)).map(([a]) => a)).toContain("Senha alterada");
  });
});

it("refuses a wrong current password with 422 on the current field, changing nothing", async () => {
  await inTest(async (db) => {
    const admin = await newUser(db);
    await newSession(db, admin.id, "here");
    await newSession(db, admin.id, "elsewhere");
    const error = await failure(
      changePassword({ id: "here", user: admin }, "errada12345", "nova123456"),
    );
    expect(error).toMatchObject({
      status: 422,
      options: { fields: { current: "Senha atual incorreta." } },
    });
    expect(await db.select().from(sessions)).toHaveLength(2);
    const [stored] = await db
      .select()
      .from(users)
      .where(eq(users.id, admin.id));
    expect(await verifyPassword("antiga1234", stored!.passwordHash!)).toBe(
      true,
    );
  });
});

it("revokes only the other sessions and reports how many", async () => {
  await inTest(async (db) => {
    const admin = await newUser(db);
    await newSession(db, admin.id, "here");
    await newSession(db, admin.id, "a");
    await newSession(db, admin.id, "b");
    expect(await endOtherSessions({ id: "here", user: admin })).toBe(2);
    expect(await db.select().from(sessions)).toHaveLength(1);
    expect((await activityOf(db)).map(([a]) => a)).toContain(
      "Sessões encerradas",
    );
  });
});

it("reads and updates the store, logging the change", async () => {
  await inTest(async (db) => {
    const admin = await newUser(db);
    await newStore(db);
    await updateStore(admin, {
      name: "Mercado Novo",
      document: "12345678000195",
      phone: "11999999999",
      address: "Rua A, 1",
      sessionIdle: "24h",
    });
    expect(await getStore()).toEqual({
      name: "Mercado Novo",
      document: "12345678000195",
      phone: "11999999999",
      address: "Rua A, 1",
      sessionIdle: "24h",
    });
    expect(await activityOf(db)).toContainEqual([
      "Dados da loja alterados",
      "Mercado Novo",
    ]);
  });
});

it("updates only the fields sent to the store", async () => {
  await inTest(async (db) => {
    const admin = await newUser(db);
    await newStore(db);
    await updateStore(admin, { phone: "11999999999" });
    await updateStore(admin, { sessionIdle: "never" });
    expect(await getStore()).toMatchObject({
      phone: "11999999999",
      sessionIdle: "never",
    });
  });
});
