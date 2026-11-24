import { randomUUID } from "node:crypto";
import { asc, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { expect, it, vi } from "vitest";
import * as schema from "@/infrastructure/db/schema";
import {
  categories,
  inventoryBatches,
  inventoryMovements,
  products,
  users,
} from "@/infrastructure/db/schema";
import {
  withTestDb,
  withTestPool,
  type TestDb,
} from "@/infrastructure/db/test-db";
import { adjustStock, consumeStock } from "./service";

vi.mock("server-only", () => ({}));

// The repositories reach the database through getDb(); point it at the test database.
let current: TestDb | NodePgDatabase<typeof schema>;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

async function seed(db: Pick<TestDb, "insert">) {
  const unique = randomUUID();
  const [user] = await db
    .insert(users)
    .values({ name: "Ana", email: `${unique}@example.com`, role: "ADMIN" })
    .returning();
  const [category] = await db
    .insert(categories)
    .values({ name: `Categoria ${unique}` })
    .returning();
  const [product] = await db
    .insert(products)
    .values({
      barcode: unique,
      name: "Iogurte",
      categoryId: category.id,
      costPrice: 300,
      sellPrice: 450,
      unit: "UN",
    })
    .returning();
  // An expired batch and a good one: the write-off takes the expired first, spilling over.
  await db.insert(inventoryBatches).values([
    {
      productId: product.id,
      batchCode: "OLD",
      expirationDate: "2026-11-01",
      quantity: 2,
    },
    {
      productId: product.id,
      batchCode: "NEW",
      expirationDate: "2027-01-10",
      quantity: 5,
    },
  ]);
  return { user, category, product };
}

async function quantities(db: Pick<TestDb, "select">, productId: string) {
  const rows = await db
    .select({ quantity: inventoryBatches.quantity })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, productId))
    .orderBy(asc(inventoryBatches.expirationDate));
  return rows.map((row) => row.quantity);
}

it("takes a repeated write-off once and answers it again, refusing the id for another one", async () => {
  await withTestDb(async (db) => {
    current = db;
    const { user, product } = await seed(db);
    const writeOff = {
      id: randomUUID(),
      productId: product.id,
      quantity: 3,
      reason: "Lote vencido",
      userId: user.id,
    };

    const first = await consumeStock(writeOff);
    // A retry after a lost response: same id, same write-off.
    const again = await consumeStock(writeOff);

    expect(again).toEqual(first);
    expect(first.map((allocation) => allocation.quantity)).toEqual([2, 1]);
    expect(await quantities(db, product.id)).toEqual([0, 4]);
    const movements = await db
      .select({ operationId: inventoryMovements.operationId })
      .from(inventoryMovements)
      .where(eq(inventoryMovements.productId, product.id));
    expect(movements).toEqual([
      { operationId: writeOff.id },
      { operationId: writeOff.id },
    ]);
    for (const change of [
      { quantity: 1 },
      { reason: "Avaria" },
      { userId: randomUUID() },
    ])
      await expect(
        consumeStock({ ...writeOff, ...change }),
      ).rejects.toMatchObject({ status: 409 });
    // Without an id, every call is a new write-off.
    await consumeStock({ ...writeOff, id: undefined, quantity: 1 });
    expect(await quantities(db, product.id)).toEqual([0, 3]);
  });
});

it("takes the stock once when the same write-off arrives twice at the same moment", async () => {
  await withTestPool(async (db) => {
    current = db;
    const seeded = await seed(db);
    const { user, product } = seeded;
    const id = randomUUID();
    try {
      // Hold the write-off's lock until both requests wait on it, so they truly overlap.
      let attempts: Promise<unknown>[] = [];
      await db.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 0))`,
        );
        attempts = [1, 2].map(() =>
          consumeStock({
            id,
            productId: product.id,
            quantity: 3,
            reason: "Lote vencido",
            userId: user.id,
          }),
        );
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
      const [first, second] = await Promise.all(attempts);

      expect(second).toEqual(first);
      expect(await quantities(db, product.id)).toEqual([0, 4]);
    } finally {
      await db
        .delete(inventoryMovements)
        .where(eq(inventoryMovements.productId, product.id));
      await db
        .delete(inventoryBatches)
        .where(eq(inventoryBatches.productId, product.id));
      await db.delete(products).where(eq(products.id, product.id));
      await db.delete(categories).where(eq(categories.id, seeded.category.id));
      await db.delete(users).where(eq(users.id, user.id));
    }
  });
}, 30_000);

const TODAY = "2026-11-24";

async function movementsOf(db: Pick<TestDb, "select">, productId: string) {
  return db
    .select({
      type: inventoryMovements.type,
      quantity: inventoryMovements.quantity,
      reason: inventoryMovements.reason,
    })
    .from(inventoryMovements)
    .where(eq(inventoryMovements.productId, productId))
    .orderBy(asc(inventoryMovements.quantity));
}

it("records a loss as a negative ADJUSTMENT by PVPS, once per id", async () => {
  await withTestDb(async (db) => {
    current = db;
    const { user, product } = await seed(db);
    const loss = {
      kind: "LOSS" as const,
      id: randomUUID(),
      productId: product.id,
      quantity: 3,
      reason: "Caixa amassada",
      userId: user.id,
    };

    const first = await adjustStock(loss, TODAY);
    expect(await adjustStock(loss, TODAY)).toEqual(first);
    expect(first.map((allocation) => allocation.quantity)).toEqual([2, 1]);
    expect(await quantities(db, product.id)).toEqual([0, 4]);
    expect(await movementsOf(db, product.id)).toEqual([
      {
        type: "ADJUSTMENT",
        quantity: -2,
        reason: "Perda ou quebra: Caixa amassada",
      },
      {
        type: "ADJUSTMENT",
        quantity: -1,
        reason: "Perda ou quebra: Caixa amassada",
      },
    ]);
    // The same id for another adjustment, or a plain write-off, is refused.
    await expect(
      adjustStock({ ...loss, quantity: 1 }, TODAY),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      consumeStock({ ...loss, reason: "Perda ou quebra: Caixa amassada" }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      adjustStock({ ...loss, id: undefined, quantity: 5 }, TODAY),
    ).rejects.toMatchObject({
      status: 409,
      options: { fields: { quantity: "Maior que o saldo deste produto." } },
    });
  });
});

it("takes an expiry adjustment only from batches past their date", async () => {
  await withTestDb(async (db) => {
    current = db;
    const { user, product } = await seed(db);
    const expired = {
      kind: "EXPIRED" as const,
      productId: product.id,
      reason: "Retirado da gôndola",
      userId: user.id,
    };

    // 2 expired units: asking for 3 would take a good one, so nothing changes.
    await expect(
      adjustStock({ ...expired, quantity: 3 }, TODAY),
    ).rejects.toMatchObject({
      status: 409,
      options: {
        fields: { quantity: "Maior que o saldo vencido deste produto." },
      },
    });
    expect(await quantities(db, product.id)).toEqual([2, 5]);
    await adjustStock({ ...expired, quantity: 2 }, TODAY);
    expect(await quantities(db, product.id)).toEqual([0, 5]);
    expect(await movementsOf(db, product.id)).toEqual([
      {
        type: "ADJUSTMENT",
        quantity: -2,
        reason: "Vencimento: Retirado da gôndola",
      },
    ]);
  });
});

it("puts what a count found into a new batch, once per id", async () => {
  await withTestDb(async (db) => {
    current = db;
    const { user, product } = await seed(db);
    const gain = {
      kind: "GAIN" as const,
      id: randomUUID(),
      productId: product.id,
      quantity: 4,
      reason: "Contagem de sexta",
      batchCode: "INV-1",
      expirationDate: null,
      userId: user.id,
    };

    const first = await adjustStock(gain, TODAY);
    expect(await adjustStock(gain, TODAY)).toEqual(first);
    expect(first).toEqual([{ batchId: gain.id, quantity: 4 }]);
    // Without a date it sorts last in PVPS.
    expect(await quantities(db, product.id)).toEqual([2, 5, 4]);
    expect(await movementsOf(db, product.id)).toEqual([
      {
        type: "ADJUSTMENT",
        quantity: 4,
        reason: "Entrada de inventário: Contagem de sexta",
      },
    ]);
    await expect(
      adjustStock({ ...gain, quantity: 5 }, TODAY),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      adjustStock(
        { ...gain, id: randomUUID(), productId: randomUUID() },
        TODAY,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
});
