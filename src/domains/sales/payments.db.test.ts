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
  items: [{ productId: coffee.id, quantity, discount: 0 }],
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

    // R$ 5,47 is above an operator's 5%: an ADMIN gives it.
    const admin = { id: user.id, role: "ADMIN" as const };
    const receipt = await registerSale(admin, input, TODAY);

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
    await expect(registerSale(admin, input, TODAY)).resolves.toEqual(receipt);
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

    // A discount of the whole sale (an ADMIN's) leaves nothing to pay.
    const free = await registerSale(
      { id: user.id, role: "ADMIN" },
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

it("lets an operator give at most 5% of the items, items and sale together; an ADMIN all", async () => {
  await withTestDb(async (db) => {
    current = db;
    const { user, category, coffee } = await seed(db);
    const cashier = { id: user.id, role: "CASHIER" as const };
    const admin = { id: user.id, role: "ADMIN" as const };
    // 3 × R$ 18,49 = R$ 55,47 of items: an operator may give up to R$ 2,77.
    const discounted = (itemDiscount: number, saleDiscount: number) => {
      const total = 5547 - itemDiscount - saleDiscount;
      return {
        id: randomUUID(),
        items: [{ productId: coffee.id, quantity: 3, discount: itemDiscount }],
        discount: saleDiscount,
        total,
        payments: total > 0 ? [{ method: "PIX" as const, amount: total }] : [],
      };
    };

    await expect(
      registerSale(cashier, discounted(200, 78), TODAY),
    ).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining("até 5%"),
      options: { fields: { discount: expect.any(String) } },
    });
    expect(await stockOf(db, coffee.id)).toBe(10);
    await expect(
      registerSale(cashier, discounted(200, 77), TODAY),
    ).resolves.toMatchObject({
      discount: 77,
      total: 5270,
      items: [{ quantity: 3, unitPrice: 1849, discount: 200, total: 5347 }],
    });

    // Nobody takes more than an item is worth; an ADMIN may give it all.
    await expect(
      registerSale(admin, discounted(5548, 0), TODAY),
    ).rejects.toMatchObject({
      status: 422,
      options: { fields: { discount: expect.any(String) } },
    });
    await expect(
      registerSale(admin, discounted(5547, 0), TODAY),
    ).resolves.toMatchObject({
      total: 0,
      items: [{ discount: 5547, total: 0 }],
    });
    expect(await stockOf(db, coffee.id)).toBe(4);

    // A line's discount cannot spill onto another line, even with the sale still above zero.
    const [tea] = await db
      .insert(products)
      .values({
        barcode: `${randomUUID()}-cha`,
        name: "Chá",
        categoryId: category.id,
        costPrice: 300,
        sellPrice: 500,
        unit: "UN",
      })
      .returning();
    await db
      .insert(inventoryBatches)
      .values({ productId: tea.id, batchCode: "T", quantity: 5 });
    await expect(
      registerSale(
        admin,
        {
          id: randomUUID(),
          items: [
            { productId: coffee.id, quantity: 1, discount: 2000 },
            { productId: tea.id, quantity: 1, discount: 0 },
          ],
          discount: 0,
          total: 349,
          payments: [{ method: "PIX", amount: 349 }],
        },
        TODAY,
      ),
    ).rejects.toMatchObject({
      status: 422,
      message: "O desconto em Café não pode passar do valor do item.",
    });
  });
});

it("records vale-refeição and vale-alimentação as methods of their own, without change", async () => {
  await withTestDb(async (db) => {
    current = db;
    const { user, coffee } = await seed(db);
    // 2 × R$ 18,49 = R$ 36,98: R$ 20,00 on VR, R$ 16,98 on VA.
    const input = sale(coffee, 2, {
      total: 3698,
      payments: [
        { method: "MEAL_VOUCHER", amount: 2000 },
        { method: "FOOD_VOUCHER", amount: 1698 },
      ],
    });
    const receipt = await registerSale(user, input, TODAY);
    expect(receipt).toMatchObject({
      amountReceived: 3698,
      change: 0,
      payments: [
        { method: "MEAL_VOUCHER", amount: 2000 },
        { method: "FOOD_VOUCHER", amount: 1698 },
      ],
    });
    expect(
      await db
        .select({ method: salePayments.method, amount: salePayments.amount })
        .from(salePayments)
        .where(eq(salePayments.saleId, input.id)),
    ).toHaveLength(2);
    // Like a card, a voucher pays its exact share: no change from it.
    await expect(
      registerSale(
        user,
        sale(coffee, 1, {
          total: 1849,
          payments: [{ method: "MEAL_VOUCHER", amount: 2000 }],
        }),
        TODAY,
      ),
    ).rejects.toMatchObject({
      status: 422,
      options: { fields: { payments: expect.any(String) } },
    });
  });
});
