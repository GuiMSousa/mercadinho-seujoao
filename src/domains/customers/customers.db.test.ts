import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { expect, it, vi } from "vitest";
import * as schema from "@/infrastructure/db/schema";
import {
  customers,
  customerTransactions,
  users,
} from "@/infrastructure/db/schema";
import {
  withTestDb,
  withTestPool,
  type TestDb,
} from "@/infrastructure/db/test-db";
import {
  createCustomer,
  findCustomerOptions,
  getStatement,
  listCustomers,
  receivePayment,
  updateCustomer,
} from "./service";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/activity/service", () => ({ logActivity: vi.fn() }));

// The repositories reach the database through getDb(); point it at the test database.
let current: TestDb | NodePgDatabase<typeof schema>;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

type Db = Pick<TestDb, "insert" | "select" | "update">;

async function admin(db: Db) {
  const [user] = await db
    .insert(users)
    .values({
      name: "Ana",
      email: `${randomUUID()}@example.com`,
      role: "ADMIN",
    })
    .returning();
  return user;
}

const customer = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  document: "",
  phone: "",
  creditLimit: 0,
  active: true,
  ...extra,
});

const payment = (amount: number, notes = "") => ({
  id: randomUUID(),
  amount,
  notes,
});

it("registers, finds and deactivates customers, refusing a repeated CPF/CNPJ", async () => {
  await withTestDb(async (db) => {
    current = db;
    const user = await admin(db);
    const unique = randomUUID();
    const maria = await createCustomer(
      user,
      customer(`Maria ${unique}`, {
        document: "52998224725",
        phone: "11987654321",
        creditLimit: 20000,
      }),
    );
    expect(maria).toMatchObject({ creditLimit: 20000, currentDebt: 0 });
    await createCustomer(user, customer(`José ${unique}`));

    const found = await listCustomers({ search: "98765", page: 1 });
    expect(found.customers.map((row) => row.id)).toEqual([maria.id]);
    // The sale screen lists active customers only, without their document.
    const options = await findCustomerOptions(unique);
    expect(options.customers.map((row) => row.name)).toEqual([
      `José ${unique}`,
      `Maria ${unique}`,
    ]);
    expect(Object.keys(options.customers[0]).sort()).toEqual([
      "creditLimit",
      "currentDebt",
      "id",
      "name",
    ]);
    await updateCustomer(user, maria.id, { active: false });
    expect(
      (await findCustomerOptions(unique)).customers.map((row) => row.name),
    ).toEqual([`José ${unique}`]);
    await expect(
      updateCustomer(user, randomUUID(), { name: "Nada" }),
    ).rejects.toMatchObject({ status: 404 });
    // Last: a violated constraint aborts the surrounding test transaction.
    await expect(
      createCustomer(
        user,
        customer(`Outra ${unique}`, { document: "52998224725" }),
      ),
    ).rejects.toMatchObject({
      status: 409,
      options: { fields: { document: expect.any(String) } },
    });
  });
});

it("takes partial and total payments off the debt, once per id, and never below zero", async () => {
  await withTestDb(async (db) => {
    current = db;
    const user = await admin(db);
    const maria = await createCustomer(
      user,
      customer(`Maria ${randomUUID()}`, { creditLimit: 20000 }),
    );
    await db
      .update(customers)
      .set({ currentDebt: 5000 })
      .where(eq(customers.id, maria.id));

    const partial = payment(2000, "Pix");
    const first = await receivePayment(user, maria.id, partial);
    expect(first.customer.currentDebt).toBe(3000);
    expect(first.transaction).toMatchObject({
      type: "PAYMENT",
      amount: 2000,
      notes: "Pix",
      userName: "Ana",
      saleNumber: null,
    });
    // A retry after a lost answer records nothing more; the same id for another payment is refused.
    await expect(receivePayment(user, maria.id, partial)).resolves.toEqual(
      first,
    );
    expect(
      (await receivePayment(user, maria.id, partial)).customer.currentDebt,
    ).toBe(3000);
    await expect(
      receivePayment(user, maria.id, { ...partial, amount: 2500 }),
    ).rejects.toMatchObject({ status: 409 });

    await expect(
      receivePayment(user, maria.id, payment(3001)),
    ).rejects.toMatchObject({
      status: 422,
      message: "O valor passa do saldo devedor de R$ 30,00.",
    });
    await receivePayment(user, maria.id, payment(3000));
    await expect(
      receivePayment(user, maria.id, payment(1)),
    ).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining("não tem saldo devedor"),
    });

    const statement = await getStatement(maria.id, 1);
    expect(statement.customer.currentDebt).toBe(0);
    expect(
      statement.transactions.map((row) => [row.type, row.amount]).sort(),
    ).toEqual([
      ["PAYMENT", 2000],
      ["PAYMENT", 3000],
    ]);
    await expect(getStatement(randomUUID(), 1)).rejects.toMatchObject({
      status: 404,
    });
  });
});

it("lets only one of two concurrent payments take the last of the debt", async () => {
  await withTestPool(async (db) => {
    current = db;
    const user = await admin(db);
    const [maria] = await db
      .insert(customers)
      .values({
        name: `Maria ${randomUUID()}`,
        creditLimit: 5000,
        currentDebt: 3000,
      })
      .returning();
    try {
      let attempts: Promise<unknown>[] = [];
      await db.transaction(async (tx) => {
        await tx
          .select({ id: customers.id })
          .from(customers)
          .where(eq(customers.id, maria.id))
          .for("update");
        attempts = [
          receivePayment(user, maria.id, payment(2000)),
          receivePayment(user, maria.id, payment(2000)),
        ];
        await vi.waitFor(
          async () => {
            const { rows } = await db.execute<{ waiting: number }>(
              sql`SELECT count(*)::int AS waiting FROM pg_stat_activity
                   WHERE datname = current_database() AND wait_event_type = 'Lock'`,
            );
            expect(rows[0].waiting).toBeGreaterThanOrEqual(2);
          },
          { timeout: 25_000, interval: 20 },
        );
      });
      const results = await Promise.allSettled(attempts);

      expect(results.map((result) => result.status).sort()).toEqual([
        "fulfilled",
        "rejected",
      ]);
      const [row] = await db
        .select({ debt: customers.currentDebt })
        .from(customers)
        .where(eq(customers.id, maria.id));
      expect(row.debt).toBe(1000);
      expect(
        await db
          .select()
          .from(customerTransactions)
          .where(eq(customerTransactions.customerId, maria.id)),
      ).toHaveLength(1);
    } finally {
      await db
        .delete(customerTransactions)
        .where(eq(customerTransactions.customerId, maria.id));
      await db.delete(customers).where(eq(customers.id, maria.id));
      await db.delete(users).where(eq(users.id, user.id));
    }
  });
}, 30_000);
