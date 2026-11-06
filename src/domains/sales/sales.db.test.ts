import { randomUUID } from "node:crypto";
import { asc, eq, inArray, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { expect, it, vi } from "vitest";
import type { CreateSale } from "@/contracts/sales";
import { findProductForSale } from "@/domains/inventory/service";
import * as schema from "@/infrastructure/db/schema";
import { parseScaleLabel, scaleGrams } from "@/lib/barcode-scale";
import {
  cashSessions,
  categories,
  inventoryBatches,
  inventoryMovements,
  products,
  saleItems,
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

const inTest = (fn: (db: TestDb) => Promise<void>) =>
  withTestDb(async (db) => {
    current = db;
    await fn(db);
  });

type Db = Pick<TestDb, "insert" | "select">;

async function seed(db: Db) {
  const unique = randomUUID();
  const [user] = await db
    .insert(users)
    .values({ name: "Carlos", email: `${unique}@example.com`, role: "CASHIER" })
    .returning();
  const [category] = await db
    .insert(categories)
    .values({ name: `Categoria ${unique}` })
    .returning();
  const [coffee, banana] = await db
    .insert(products)
    .values([
      {
        barcode: `${unique}-cafe`,
        name: "Café",
        categoryId: category.id,
        costPrice: 1290,
        sellPrice: 1849,
        unit: "UN",
      },
      {
        // Prices per kg; quantities in grams.
        barcode: `${unique}-banana`,
        name: "Banana",
        categoryId: category.id,
        costPrice: 400,
        sellPrice: 699,
        unit: "KG",
      },
    ])
    .returning();
  // Sales need an open drawer.
  const [cash] = await db
    .insert(cashSessions)
    .values({ userId: user.id, initialAmount: 0 })
    .returning();
  return { user, category, coffee, banana, cash };
}

const batch = (
  productId: string,
  batchCode: string,
  expirationDate: string | null,
  quantity: number,
) => ({ productId, batchCode, expirationDate, quantity });

async function quantities(db: Db, productId: string) {
  const rows = await db
    .select({ quantity: inventoryBatches.quantity })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, productId))
    .orderBy(asc(inventoryBatches.expirationDate));
  return rows.map((row) => row.quantity);
}

const saleCount = async (db: Db, id: string) =>
  (await db.select().from(sales).where(eq(sales.id, id))).length;

const sale = (overrides: Partial<CreateSale> = {}): CreateSale => ({
  id: randomUUID(),
  items: [],
  paymentMethod: "PIX",
  total: 0,
  ...overrides,
});

it("refuses a sale with the cash closed, before and inside the transaction", async () => {
  await inTest(async (db) => {
    const { user, coffee, cash } = await seed(db);
    await db.insert(inventoryBatches).values(batch(coffee.id, "A", null, 5));
    const input = sale({
      items: [{ productId: coffee.id, quantity: 1 }],
      total: 1849,
    });

    const first = await registerSale(user, input, TODAY);
    const [recorded] = await db
      .select({ cashSessionId: sales.cashSessionId })
      .from(sales)
      .where(eq(sales.id, first.id));
    expect(recorded.cashSessionId).toBe(cash.id);

    await db
      .update(cashSessions)
      .set({
        status: "CLOSED",
        closedAt: new Date(),
        expectedAmount: 1849,
        actualAmount: 1849,
        difference: 0,
      })
      .where(eq(cashSessions.id, cash.id));
    await expect(
      registerSale(user, { ...input, id: randomUUID() }, TODAY),
    ).rejects.toMatchObject({
      status: 422,
      message: "Não é possível realizar vendas com o caixa fechado.",
      options: { fields: { cash: expect.any(String) } },
    });
    expect(await quantities(db, coffee.id)).toEqual([4]);
    // A retry of the sale made before closing still answers that sale.
    await expect(registerSale(user, input, TODAY)).resolves.toEqual(first);
  });
});

it("records the sale at catalog prices with its cost, and takes each product by PVPS", async () => {
  await inTest(async (db) => {
    const { user, coffee, banana } = await seed(db);
    await db
      .insert(inventoryBatches)
      .values([
        batch(coffee.id, "LATE", "2027-01-01", 5),
        batch(coffee.id, "SOON", "2026-12-01", 2),
        batch(banana.id, "B1", "2026-11-20", 3000),
      ]);

    // 3 × R$ 18,49 + 1,250 kg × R$ 6,99 (R$ 8,7375 → R$ 8,74).
    const receipt = await registerSale(
      user,
      sale({
        items: [
          { productId: coffee.id, quantity: 3 },
          { productId: banana.id, quantity: 1250 },
        ],
        paymentMethod: "CASH",
        total: 5547 + 874,
        amountReceived: 7000,
      }),
      TODAY,
    );

    expect(receipt).toMatchObject({
      paymentMethod: "CASH",
      total: 6421,
      amountReceived: 7000,
      change: 579,
      items: [
        {
          productId: coffee.id,
          name: "Café",
          unit: "UN",
          quantity: 3,
          unitPrice: 1849,
          total: 5547,
        },
        {
          productId: banana.id,
          name: "Banana",
          unit: "KG",
          quantity: 1250,
          unitPrice: 699,
          total: 874,
        },
      ],
    });
    expect(receipt.createdAt).toMatch(/^\d{4}-\d\d-\d\dT/);
    for (const item of receipt.items) expect(item).not.toHaveProperty("cost");
    // PVPS: the batch that expires first goes first, then the next one.
    expect(await quantities(db, coffee.id)).toEqual([0, 4]);
    expect(await quantities(db, banana.id)).toEqual([1750]);

    const lines = await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, receipt.id))
      .orderBy(asc(saleItems.line));
    // CMV recorded at the sale: 3 × R$ 12,90 and 1,250 kg × R$ 4,00.
    expect(lines.map((line) => [line.unitCost, line.cost])).toEqual([
      [1290, 3870],
      [400, 500],
    ]);
    const movements = await db
      .select()
      .from(inventoryMovements)
      .where(inArray(inventoryMovements.productId, [coffee.id, banana.id]));
    expect(movements).toHaveLength(3);
    for (const movement of movements)
      expect(movement).toMatchObject({
        type: "OUT",
        userId: user.id,
        reason: `Venda nº ${receipt.number}`,
      });
  });
});

it("sells products scanned from scale labels, by weight and by price, at catalog prices", async () => {
  await inTest(async (db) => {
    const { user, category } = await seed(db);
    // A weighed product carries the scale's 5-digit code as its barcode.
    const [picanha, cheese] = await db
      .insert(products)
      .values([
        {
          barcode: "00123",
          name: "Picanha",
          categoryId: category.id,
          costPrice: 5500,
          sellPrice: 8000,
          unit: "KG",
        },
        {
          barcode: "00456",
          name: "Queijo",
          categoryId: category.id,
          costPrice: 3000,
          sellPrice: 4590,
          unit: "KG",
        },
      ])
      .returning();
    await db
      .insert(inventoryBatches)
      .values([
        batch(picanha.id, "P1", "2026-11-10", 1000),
        batch(picanha.id, "P2", "2026-11-12", 2000),
        batch(cheese.id, "Q1", "2026-11-20", 1000),
      ]);

    // What the PDV does with a scan that is no registered barcode.
    const scan = async (code: string) => {
      const label = parseScaleLabel(code);
      if (!label) throw new Error(`Not a scale label: ${code}`);
      const product = await findProductForSale(label.code, TODAY);
      const quantity = scaleGrams(label, product.sellPrice);
      if (quantity === null) throw new Error(`No weight for ${code}`);
      return { productId: product.id, quantity };
    };
    const items = [
      // 1,500 kg weighed at the butcher: 1,500 kg × R$ 80,00 = R$ 120,00.
      await scan("2100123015009"),
      // A R$ 15,00 label at R$ 45,90/kg: 326 g, R$ 14,96 (never above the label).
      await scan("2000456015007"),
    ];
    expect(items).toEqual([
      { productId: picanha.id, quantity: 1500 },
      { productId: cheese.id, quantity: 326 },
    ]);

    const receipt = await registerSale(
      user,
      sale({ items, total: 12000 + 1496 }),
      TODAY,
    );
    expect(
      receipt.items.map((item) => [item.name, item.quantity, item.total]),
    ).toEqual([
      ["Picanha", 1500, 12000],
      ["Queijo", 326, 1496],
    ]);
    // PVPS in grams: the batch that expires first empties, the rest comes from the next one.
    expect(await quantities(db, picanha.id)).toEqual([0, 1500]);
    expect(await quantities(db, cheese.id)).toEqual([674]);
  });
});

it("refuses a product whose next batch is expired, and writes nothing", async () => {
  await inTest(async (db) => {
    const { user, coffee } = await seed(db);
    await db
      .insert(inventoryBatches)
      .values([
        batch(coffee.id, "OLD", "2026-11-04", 2),
        batch(coffee.id, "NEW", "2027-01-01", 5),
      ]);
    const input = sale({
      items: [{ productId: coffee.id, quantity: 1 }],
      total: 1849,
    });

    await expect(registerSale(user, input, TODAY)).rejects.toMatchObject({
      status: 409,
      message:
        "Café: o lote que sai primeiro está vencido. Separe o produto e avise o administrador.",
    });
    expect(await saleCount(db, input.id)).toBe(0);
    expect(await quantities(db, coffee.id)).toEqual([2, 5]);
    // The day it expires, it still sells.
    await expect(
      registerSale(user, input, "2026-11-04"),
    ).resolves.toMatchObject({ total: 1849 });
  });
});

it("keeps every product on the shelf when one of them is short", async () => {
  await inTest(async (db) => {
    const { user, coffee, banana } = await seed(db);
    await db
      .insert(inventoryBatches)
      .values([
        batch(coffee.id, "A", null, 5),
        batch(banana.id, "B", "2026-12-01", 100),
      ]);
    const input = sale({
      items: [
        { productId: coffee.id, quantity: 2 },
        { productId: banana.id, quantity: 1250 },
      ],
      total: 3698 + 874,
    });

    await expect(registerSale(user, input, TODAY)).rejects.toMatchObject({
      status: 409,
      message: "Estoque insuficiente de Banana. Confira a quantidade.",
    });
    expect(await saleCount(db, input.id)).toBe(0);
    expect(await quantities(db, coffee.id)).toEqual([5]);
    expect(await quantities(db, banana.id)).toEqual([100]);
  });
});

it("refuses a changed price, short cash and inactive products before touching stock", async () => {
  await inTest(async (db) => {
    const { user, coffee } = await seed(db);
    await db.insert(inventoryBatches).values(batch(coffee.id, "A", null, 5));
    const items = [{ productId: coffee.id, quantity: 2 }];

    await expect(
      registerSale(user, sale({ items, total: 3600 }), TODAY),
    ).rejects.toMatchObject({
      status: 409,
      options: { fields: { total: expect.any(String) } },
    });
    await expect(
      registerSale(
        user,
        sale({
          items,
          total: 3698,
          paymentMethod: "CASH",
          amountReceived: 3697,
        }),
        TODAY,
      ),
    ).rejects.toMatchObject({
      status: 422,
      options: { fields: { amountReceived: expect.any(String) } },
    });
    await db
      .update(products)
      .set({ active: false })
      .where(eq(products.id, coffee.id));
    await expect(
      registerSale(user, sale({ items, total: 3698 }), TODAY),
    ).rejects.toMatchObject({
      status: 409,
      message: "Café não está mais à venda. Remova-o e finalize de novo.",
    });
    expect(await quantities(db, coffee.id)).toEqual([5]);
  });
});

it("takes the total as received without cash, ignoring a stray amount", async () => {
  await inTest(async (db) => {
    const { user, coffee } = await seed(db);
    await db.insert(inventoryBatches).values(batch(coffee.id, "A", null, 5));

    const receipt = await registerSale(
      user,
      sale({
        items: [{ productId: coffee.id, quantity: 1 }],
        paymentMethod: "DEBIT",
        total: 1849,
        amountReceived: 5000,
      }),
      TODAY,
    );

    expect(receipt).toMatchObject({
      paymentMethod: "DEBIT",
      amountReceived: 1849,
      change: 0,
    });
  });
});

it("answers a repeated sale with the one recorded, and refuses the id for another sale", async () => {
  await inTest(async (db) => {
    const { user, coffee } = await seed(db);
    await db.insert(inventoryBatches).values(batch(coffee.id, "A", null, 5));
    const input = sale({
      items: [{ productId: coffee.id, quantity: 2 }],
      total: 3698,
    });

    const first = await registerSale(user, input, TODAY);
    const again = await registerSale(user, input, TODAY);

    expect(again).toEqual(first);
    expect(await quantities(db, coffee.id)).toEqual([3]);
    await expect(
      registerSale(
        user,
        {
          ...input,
          items: [{ productId: coffee.id, quantity: 1 }],
          total: 1849,
        },
        TODAY,
      ),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      registerSale({ id: randomUUID() }, input, TODAY),
    ).rejects.toMatchObject({ status: 409 });
    expect(await quantities(db, coffee.id)).toEqual([3]);
  });
});

async function removeSeed(
  db: NodePgDatabase<typeof schema>,
  { user, category, coffee, banana, cash }: Awaited<ReturnType<typeof seed>>,
) {
  const ids = [coffee.id, banana.id];
  await db.delete(saleItems).where(inArray(saleItems.productId, ids));
  await db.delete(sales).where(eq(sales.userId, user.id));
  await db.delete(cashSessions).where(eq(cashSessions.id, cash.id));
  await db
    .delete(inventoryMovements)
    .where(inArray(inventoryMovements.productId, ids));
  await db
    .delete(inventoryBatches)
    .where(inArray(inventoryBatches.productId, ids));
  await db.delete(products).where(inArray(products.id, ids));
  await db.delete(categories).where(eq(categories.id, category.id));
  await db.delete(users).where(eq(users.id, user.id));
}

it("lets only one of two concurrent sales take the last units", async () => {
  await withTestPool(async (db) => {
    current = db;
    const seeded = await seed(db);
    const { user, coffee } = seeded;
    try {
      await db
        .insert(inventoryBatches)
        .values([
          batch(coffee.id, "A", "2026-12-01", 2),
          batch(coffee.id, "B", "2027-01-01", 1),
        ]);
      const sell = () =>
        registerSale(
          user,
          sale({ items: [{ productId: coffee.id, quantity: 2 }], total: 3698 }),
          TODAY,
        );

      // Hold the batches until both sales wait on them, so they truly overlap.
      let attempts: Promise<unknown>[] = [];
      await db.transaction(async (tx) => {
        await tx
          .select({ id: inventoryBatches.id })
          .from(inventoryBatches)
          .where(eq(inventoryBatches.productId, coffee.id))
          .for("update");
        attempts = [sell(), sell()];
        await vi.waitFor(
          async () => {
            // On another connection: inside a transaction this view stays frozen at its first read.
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
      const refused = results.find((result) => result.status === "rejected");
      expect(refused?.reason).toMatchObject({ status: 409 });
      expect(await quantities(db, coffee.id)).toEqual([0, 1]);
      expect(
        await db.select().from(sales).where(eq(sales.userId, user.id)),
      ).toHaveLength(1);
    } finally {
      await removeSeed(db, seeded);
    }
  });
}, 30_000);
