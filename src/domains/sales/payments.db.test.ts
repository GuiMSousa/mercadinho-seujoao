import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { expect, it, vi } from "vitest";
import type { CreateSale } from "@/contracts/sales";
import * as schema from "@/infrastructure/db/schema";
import {
  cashSessions,
  categories,
  customers,
  customerTransactions,
  inventoryBatches,
  inventoryMovements,
  products,
  saleItems,
  salePayments,
  sales,
  users,
} from "@/infrastructure/db/schema";
import {
  withTestDb,
  withTestPool,
  type TestDb,
} from "@/infrastructure/db/test-db";
import { registerSale } from "./service";

vi.mock("server-only", () => ({}));

// The repositories reach the database through getDb(); point it at the test database.
let current: TestDb | NodePgDatabase<typeof schema>;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

const TODAY = "2026-11-05";

type Db = Pick<TestDb, "insert" | "select" | "update">;

/** A cashier with an open drawer, coffee at R$ 18,49 (10 in stock) and a fiado customer. */
async function seed(db: Db, creditLimit = 10000) {
  const unique = randomUUID();
  const [user] = await db
    .insert(users)
    .values({ name: "Carlos", email: `${unique}@example.com`, role: "CASHIER" })
    .returning();
  const [category] = await db
    .insert(categories)
    .values({ name: `Categoria ${unique}` })
    .returning();
  const [coffee] = await db
    .insert(products)
    .values({
      barcode: `${unique}-cafe`,
      name: "Café",
      categoryId: category.id,
      costPrice: 1290,
      sellPrice: 1849,
      unit: "UN",
    })
    .returning();
  await db
    .insert(inventoryBatches)
    .values({ productId: coffee.id, batchCode: "A", quantity: 10 });
  const [cash] = await db
    .insert(cashSessions)
    .values({ userId: user.id, initialAmount: 0 })
    .returning();
  const [customer] = await db
    .insert(customers)
    .values({ name: `Dona Maria ${unique}`, creditLimit })
    .returning();
  return { user, category, coffee, cash, customer };
}

const sale = (
  coffee: { id: string },
  quantity: number,
  rest: Omit<CreateSale, "id" | "items" | "discount"> &
    Partial<Pick<CreateSale, "discount">>,
): CreateSale => ({
  id: randomUUID(),
  items: [{ productId: coffee.id, quantity }],
  discount: 0,
  ...rest,
});

const debtOf = async (db: Db, id: string) =>
  (
    await db
      .select({ debt: customers.currentDebt })
      .from(customers)
      .where(eq(customers.id, id))
  )[0].debt;

const stockOf = async (db: Db, productId: string) =>
  (
    await db
      .select({ quantity: inventoryBatches.quantity })
      .from(inventoryBatches)
      .where(eq(inventoryBatches.productId, productId))
  )[0].quantity;

it("splits a discounted sale among cash, Pix and fiado, raising the customer's debt with it", async () => {
  await withTestDb(async (db) => {
    current = db;
    const { user, coffee, customer } = await seed(db);
    // 3 × R$ 18,49 = R$ 55,47, minus R$ 5,47 = R$ 50,00: R$ 25,00 handed in cash for a R$ 20,00
    // share (R$ 5,00 change), R$ 15,00 by Pix and R$ 15,00 on account.
    const input = sale(coffee, 3, {
      discount: 547,
      total: 5000,
      payments: [
        { method: "CASH", amount: 2500 },
        { method: "PIX", amount: 1500 },
        { method: "ON_ACCOUNT", amount: 1500 },
      ],
      customerId: customer.id,
    });

    const receipt = await registerSale(user, input, TODAY);

    expect(receipt).toMatchObject({
      discount: 547,
      total: 5000,
      amountReceived: 5500,
      change: 500,
      payments: [
        { method: "CASH", amount: 2000 },
        { method: "PIX", amount: 1500 },
        { method: "ON_ACCOUNT", amount: 1500 },
      ],
      customerName: customer.name,
    });
    expect(await debtOf(db, customer.id)).toBe(1500);
    expect(
      await db
        .select({
          type: customerTransactions.type,
          amount: customerTransactions.amount,
          saleId: customerTransactions.saleId,
        })
        .from(customerTransactions)
        .where(eq(customerTransactions.customerId, customer.id)),
    ).toEqual([{ type: "DEBIT", amount: 1500, saleId: input.id }]);
    const [row] = await db.select().from(sales).where(eq(sales.id, input.id));
    expect(row).toMatchObject({ customerId: customer.id, discount: 547 });

    // A retry after a lost answer charges nothing twice.
    await expect(registerSale(user, input, TODAY)).resolves.toEqual(receipt);
    expect(await debtOf(db, customer.id)).toBe(1500);
    expect(await stockOf(db, coffee.id)).toBe(7);
  });
});

it("refuses fiado past the credit limit or for an inactive customer, writing nothing", async () => {
  await withTestDb(async (db) => {
    current = db;
    const { user, coffee, customer } = await seed(db, 3000);
    await db
      .update(customers)
      .set({ currentDebt: 2000 })
      .where(eq(customers.id, customer.id));
    const onAccount = () =>
      sale(coffee, 1, {
        total: 1849,
        payments: [{ method: "ON_ACCOUNT", amount: 1849 }],
        customerId: customer.id,
      });

    // R$ 20,00 owed + R$ 18,49 > R$ 30,00.
    await expect(registerSale(user, onAccount(), TODAY)).rejects.toMatchObject({
      status: 422,
      message: expect.stringMatching(
        /^Limite de crédito excedido: .+ tem R\$\s10,00 disponíveis/,
      ),
      options: { fields: { customerId: expect.any(String) } },
    });
    expect(await debtOf(db, customer.id)).toBe(2000);
    expect(await stockOf(db, coffee.id)).toBe(10);
    expect(
      await db.select().from(sales).where(eq(sales.userId, user.id)),
    ).toEqual([]);

    // Exactly at the limit passes.
    await db
      .update(customers)
      .set({ creditLimit: 3849 })
      .where(eq(customers.id, customer.id));
    await registerSale(user, onAccount(), TODAY);
    expect(await debtOf(db, customer.id)).toBe(3849);

    await db
      .update(customers)
      .set({ active: false, creditLimit: 100000 })
      .where(eq(customers.id, customer.id));
    await expect(registerSale(user, onAccount(), TODAY)).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining("inativo"),
    });
    expect(await debtOf(db, customer.id)).toBe(3849);
  });
});

it("refuses a discount above the subtotal and payments that do not settle the total", async () => {
  await withTestDb(async (db) => {
    current = db;
    const { user, coffee } = await seed(db);

    await expect(
      registerSale(
        user,
        sale(coffee, 1, { discount: 1850, total: 0, payments: [] }),
        TODAY,
      ),
    ).rejects.toMatchObject({
      status: 422,
      options: { fields: { discount: expect.any(String) } },
    });
    await expect(
      registerSale(
        user,
        sale(coffee, 1, {
          total: 1849,
          payments: [
            { method: "PIX", amount: 1000 },
            { method: "DEBIT", amount: 800 },
          ],
        }),
        TODAY,
      ),
    ).rejects.toMatchObject({
      status: 422,
      options: { fields: { payments: expect.any(String) } },
    });
    expect(await stockOf(db, coffee.id)).toBe(10);

    // A discount of the whole sale leaves nothing to pay.
    const free = await registerSale(
      user,
      sale(coffee, 1, { discount: 1849, total: 0, payments: [] }),
      TODAY,
    );
    expect(free).toMatchObject({ total: 0, payments: [], change: 0 });
    expect(await stockOf(db, coffee.id)).toBe(9);
  });
});

it("lets only one of two concurrent fiado sales fit the credit limit", async () => {
  await withTestPool(async (db) => {
    current = db;
    const seeded = await seed(db, 3000);
    const { user, category, coffee, cash, customer } = seeded;
    try {
      const attempt = () =>
        registerSale(
          user,
          sale(coffee, 1, {
            total: 1849,
            payments: [{ method: "ON_ACCOUNT", amount: 1849 }],
            customerId: customer.id,
          }),
          TODAY,
        );
      // Hold the customer until both sales wait on it, so they truly overlap.
      let attempts: Promise<unknown>[] = [];
      await db.transaction(async (tx) => {
        await tx
          .select({ id: customers.id })
          .from(customers)
          .where(eq(customers.id, customer.id))
          .for("update");
        attempts = [attempt(), attempt()];
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
      expect(
        results.find((result) => result.status === "rejected")?.reason,
      ).toMatchObject({ status: 422 });
      expect(await debtOf(db, customer.id)).toBe(1849);
      expect(await stockOf(db, coffee.id)).toBe(9);
    } finally {
      const saleIds = db
        .select({ id: sales.id })
        .from(sales)
        .where(eq(sales.userId, user.id));
      await db
        .delete(customerTransactions)
        .where(eq(customerTransactions.customerId, customer.id));
      await db
        .delete(salePayments)
        .where(inArray(salePayments.saleId, saleIds));
      await db.delete(saleItems).where(inArray(saleItems.saleId, saleIds));
      await db.delete(sales).where(eq(sales.userId, user.id));
      await db.delete(customers).where(eq(customers.id, customer.id));
      await db.delete(cashSessions).where(eq(cashSessions.id, cash.id));
      await db
        .delete(inventoryMovements)
        .where(eq(inventoryMovements.productId, coffee.id));
      await db
        .delete(inventoryBatches)
        .where(eq(inventoryBatches.productId, coffee.id));
      await db.delete(products).where(eq(products.id, coffee.id));
      await db.delete(categories).where(eq(categories.id, category.id));
      await db.delete(users).where(eq(users.id, user.id));
    }
  });
}, 30_000);
