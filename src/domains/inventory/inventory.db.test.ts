import { randomUUID } from "node:crypto";
import { asc, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import * as schema from "@/infrastructure/db/schema";
import {
  activityLog,
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
import {
  consumeStock,
  createCategory,
  createProduct,
  findProductForSale,
  listInventory,
  listProducts,
  receiveBatch,
  updateProduct,
} from "./service";

vi.mock("server-only", () => ({}));

// The repositories reach the database through getDb(); point it at the test database.
let current: TestDb | NodePgDatabase<typeof schema>;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

const inTest = (fn: (db: TestDb) => Promise<void>) =>
  withTestDb(async (db) => {
    current = db;
    await fn(db);
  });

async function seed(db: Pick<TestDb, "insert">) {
  const unique = randomUUID();
  const [user] = await db
    .insert(users)
    .values({
      name: "Ana",
      email: `${unique}@example.com`,
      role: "ADMIN",
    })
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
  return { user, category, product };
}

const batch = (
  productId: string,
  code: string,
  date: string,
  quantity: number,
) => ({
  productId,
  batchCode: code,
  expirationDate: date,
  quantity,
});

async function quantities(db: Pick<TestDb, "select">, productId: string) {
  const rows = await db
    .select()
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, productId))
    .orderBy(asc(inventoryBatches.expirationDate));
  return rows.map((row) => row.quantity);
}

it("takes stock from the batch that expires first and records the movement", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    // The later date is inserted first, so entry order alone would pick the wrong batch.
    await db
      .insert(inventoryBatches)
      .values(batch(product.id, "LATE", "2027-03-01", 10));
    const [soon] = await db
      .insert(inventoryBatches)
      .values(batch(product.id, "SOON", "2026-12-01", 10))
      .returning();

    const allocations = await consumeStock({
      productId: product.id,
      quantity: 4,
      reason: "Avaria",
      userId: user.id,
    });

    expect(allocations).toEqual([{ batchId: soon.id, quantity: 4 }]);
    expect(await quantities(db, product.id)).toEqual([6, 10]);
    const movements = await db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.productId, product.id));
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({
      productId: product.id,
      batchId: soon.id,
      type: "OUT",
      quantity: 4,
      reason: "Avaria",
      userId: user.id,
    });
  });
});

it("spills over to the next batch with one movement per batch", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    await db
      .insert(inventoryBatches)
      .values([
        batch(product.id, "B", "2027-01-01", 5),
        batch(product.id, "A", "2026-12-01", 2),
      ]);

    await consumeStock({
      productId: product.id,
      quantity: 3,
      reason: "Avaria",
      userId: user.id,
    });

    expect(await quantities(db, product.id)).toEqual([0, 4]);
    expect(
      await db
        .select()
        .from(inventoryMovements)
        .where(eq(inventoryMovements.productId, product.id)),
    ).toHaveLength(2);
  });
});

it("refuses more than the stock and changes nothing", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    await db
      .insert(inventoryBatches)
      .values(batch(product.id, "A", "2026-12-01", 2));

    const error = await consumeStock({
      productId: product.id,
      quantity: 3,
      reason: "Avaria",
      userId: user.id,
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ServiceError);
    expect((error as ServiceError).status).toBe(409);
    expect(await quantities(db, product.id)).toEqual([2]);
    expect(
      await db
        .select()
        .from(inventoryMovements)
        .where(eq(inventoryMovements.productId, product.id)),
    ).toHaveLength(0);
  });
});

it("refuses an unknown product and a quantity that is not a positive integer", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    await db
      .insert(inventoryBatches)
      .values(batch(product.id, "A", "2026-12-01", 2));
    const input = { reason: "Avaria", userId: user.id };

    await expect(
      consumeStock({ ...input, productId: randomUUID(), quantity: 1 }),
    ).rejects.toMatchObject({ status: 404 });
    for (const quantity of [0, -1, 1.5]) {
      await expect(
        consumeStock({ ...input, productId: product.id, quantity }),
      ).rejects.toMatchObject({ status: 422 });
    }
    expect(await quantities(db, product.id)).toEqual([2]);
  });
});

async function removeSeed(
  db: NodePgDatabase<typeof schema>,
  { user, category, product }: Awaited<ReturnType<typeof seed>>,
) {
  await db
    .delete(inventoryMovements)
    .where(eq(inventoryMovements.productId, product.id));
  await db
    .delete(inventoryBatches)
    .where(eq(inventoryBatches.productId, product.id));
  await db.delete(products).where(eq(products.id, product.id));
  await db.delete(categories).where(eq(categories.id, category.id));
  await db.delete(users).where(eq(users.id, user.id));
}

/**
 * Runs two sales that truly overlap: a new connection takes long enough for the first sale to
 * finish alone, so the batches stay locked until both sales are waiting on them.
 */
async function overlappingSales(
  db: NodePgDatabase<typeof schema>,
  productId: string,
  sale: () => Promise<unknown>,
) {
  let sales: Promise<unknown>[] = [];
  await db.transaction(async (tx) => {
    await tx
      .select({ id: inventoryBatches.id })
      .from(inventoryBatches)
      .where(eq(inventoryBatches.productId, productId))
      .for("update");
    sales = [sale(), sale()];
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
  return Promise.allSettled(sales);
}

it("lets only one of two concurrent sales spend the same stock", async () => {
  await withTestPool(async (db) => {
    current = db;
    const seeded = await seed(db);
    const { user, product } = seeded;
    try {
      await db
        .insert(inventoryBatches)
        .values([
          batch(product.id, "A", "2026-12-01", 5),
          batch(product.id, "B", "2027-01-01", 5),
        ]);
      const sale = () =>
        consumeStock({
          productId: product.id,
          quantity: 7,
          reason: "Venda",
          userId: user.id,
        });

      const results = await overlappingSales(db, product.id, sale);

      expect(results.map((result) => result.status).sort()).toEqual([
        "fulfilled",
        "rejected",
      ]);
      // Without the lock the loser fails on the CHECK constraint: a 500, not this answer.
      const refused = results.find((result) => result.status === "rejected");
      expect(refused?.reason).toMatchObject({ status: 409 });
      const total = (await quantities(db, product.id)).reduce(
        (sum, quantity) => sum + quantity,
        0,
      );
      expect(total).toBe(3);
    } finally {
      await removeSeed(db, seeded);
    }
  });
}, 30_000);

it("serves two concurrent sales the stock covers, spilling into the next batch", async () => {
  await withTestPool(async (db) => {
    current = db;
    const seeded = await seed(db);
    const { user, product } = seeded;
    try {
      await db
        .insert(inventoryBatches)
        .values([
          batch(product.id, "A", "2026-12-01", 5),
          batch(product.id, "B", "2027-01-01", 5),
        ]);
      const sale = () =>
        consumeStock({
          productId: product.id,
          quantity: 4,
          reason: "Venda",
          userId: user.id,
        });

      const results = await overlappingSales(db, product.id, sale);

      expect(results.map((result) => result.status)).toEqual([
        "fulfilled",
        "fulfilled",
      ]);
      // Without the lock both read 5 in A, and the second fails instead of spilling into B.
      expect(await quantities(db, product.id)).toEqual([0, 2]);
    } finally {
      await removeSeed(db, seeded);
    }
  });
}, 30_000);

it("adds no stock when a sale's movement cannot be written", async () => {
  await inTest(async (db) => {
    const { product } = await seed(db);
    await db
      .insert(inventoryBatches)
      .values(batch(product.id, "A", "2026-12-01", 5));

    await expect(
      consumeStock({
        productId: product.id,
        quantity: 2,
        reason: "Venda",
        userId: randomUUID(),
      }),
    ).rejects.toThrow();

    expect(await quantities(db, product.id)).toEqual([5]);
  });
});

it("creates no batch when its IN movement cannot be written", async () => {
  await inTest(async (db) => {
    const { product } = await seed(db);

    await expect(
      receiveBatch(randomUUID(), product.id, {
        id: randomUUID(),
        batchCode: "L-1",
        expirationDate: "2026-12-01",
        quantity: 8,
      }),
    ).rejects.toThrow();

    expect(await quantities(db, product.id)).toEqual([]);
  });
});

it("refuses a repeated id with other values, instead of keeping the old ones", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    const entry = {
      id: randomUUID(),
      batchCode: "L-1",
      expirationDate: "2026-12-01",
      quantity: 10,
    };
    await receiveBatch(user.id, product.id, entry);
    for (const change of [
      { quantity: 12 },
      { batchCode: "L-2" },
      { expirationDate: null },
    ]) {
      await expect(
        receiveBatch(user.id, product.id, { ...entry, ...change }),
      ).rejects.toMatchObject({ status: 409 });
    }
    expect(await quantities(db, product.id)).toEqual([10]);
  });
});

it("recognises a repeated entry after part of it was sold", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    const entry = {
      id: randomUUID(),
      batchCode: "L-1",
      expirationDate: "2026-12-01",
      quantity: 10,
    };
    await receiveBatch(user.id, product.id, entry);
    await consumeStock({
      productId: product.id,
      quantity: 4,
      reason: "Venda",
      userId: user.id,
    });
    await expect(
      receiveBatch(user.id, product.id, entry),
    ).resolves.toMatchObject({ quantity: 6 });
    expect(await quantities(db, product.id)).toEqual([6]);
  });
});

it("creates its own batch id when the client sends none", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    await expect(
      receiveBatch(user.id, product.id, {
        batchCode: "L-1",
        expirationDate: null,
        quantity: 1,
      }),
    ).resolves.toMatchObject({ id: expect.any(String) as string });
  });
});

it("enters a repeated batch once, and refuses an id from another product", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    const entry = {
      id: randomUUID(),
      batchCode: "L-1",
      expirationDate: "2026-12-01",
      quantity: 8,
    };

    const first = await receiveBatch(user.id, product.id, entry);
    const retry = await receiveBatch(user.id, product.id, entry);

    expect(retry).toMatchObject(first);
    expect(await quantities(db, product.id)).toEqual([8]);
    const movements = await db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.productId, product.id));
    expect(movements).toHaveLength(1);

    const other = await seed(db);
    await expect(
      receiveBatch(user.id, other.product.id, entry),
    ).rejects.toMatchObject({ status: 409 });
    expect(await quantities(db, other.product.id)).toEqual([]);
  });
});

it("records a received batch with its IN movement and counts it as stock", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);

    const received = await receiveBatch(user.id, product.id, {
      id: randomUUID(),
      batchCode: "L-1",
      expirationDate: "2026-12-01",
      quantity: 8,
    });

    expect(received).toMatchObject({ batchCode: "L-1", quantity: 8 });
    const [movement] = await db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.productId, product.id));
    expect(movement).toMatchObject({
      batchId: received.id,
      type: "IN",
      quantity: 8,
      userId: user.id,
    });
    const { products: rows } = await listProducts({
      search: product.barcode,
      page: 1,
    });
    expect(rows.map((row) => row.stock)).toEqual([8]);
    expect(rows[0].hasBatches).toBe(true);
    await expect(
      receiveBatch(user.id, randomUUID(), {
        id: randomUUID(),
        batchCode: "L-2",
        expirationDate: "2026-12-01",
        quantity: 1,
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

it("reads a product for the sale without cost, and hides inactive ones", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    await db
      .insert(inventoryBatches)
      .values(batch(product.id, "A", "2026-12-01", 2));

    const forSale = await findProductForSale(product.barcode);

    expect(forSale).toEqual({
      id: product.id,
      barcode: product.barcode,
      name: "Iogurte",
      sellPrice: 450,
      unit: "UN",
      stock: 2,
    });
    await updateProduct(user, product.id, { active: false });
    await expect(findProductForSale(product.barcode)).rejects.toMatchObject({
      status: 404,
    });
  });
});

it("creates products and categories, refusing repeats and unknown categories", async () => {
  await inTest(async (db) => {
    const { user, category, product } = await seed(db);
    const input = {
      barcode: randomUUID(),
      name: "Café",
      categoryId: category.id,
      costPrice: 1290,
      sellPrice: 1849,
      minStock: 6,
      unit: "UN" as const,
      active: true,
    };

    await expect(createProduct(user, input)).resolves.toMatchObject({
      name: "Café",
      stock: 0,
    });
    const logged = await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, user.id));
    expect(logged).toHaveLength(1);

    await expect(
      createProduct(user, {
        ...input,
        barcode: randomUUID(),
        categoryId: randomUUID(),
      }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      updateProduct(user, randomUUID(), { name: "Outro" }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      createCategory(user, { name: `Nova ${randomUUID()}` }),
    ).resolves.toMatchObject({ id: expect.any(String) as string });

    // Last: a violated constraint aborts the surrounding test transaction.
    await expect(
      createProduct(user, { ...input, barcode: product.barcode }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

it("refuses a repeated category name", async () => {
  await inTest(async (db) => {
    const { user, category } = await seed(db);
    await expect(
      createCategory(user, { name: category.name }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

it("takes batches without expiration last", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    const [none] = await db
      .insert(inventoryBatches)
      .values({
        productId: product.id,
        batchCode: "SEM",
        expirationDate: null,
        quantity: 5,
      })
      .returning();
    const [dated] = await db
      .insert(inventoryBatches)
      .values(batch(product.id, "COM", "2027-01-01", 1))
      .returning();

    const allocations = await consumeStock({
      productId: product.id,
      quantity: 2,
      reason: "Avaria",
      userId: user.id,
    });

    expect(allocations).toEqual([
      { batchId: dated.id, quantity: 1 },
      { batchId: none.id, quantity: 1 },
    ]);
  });
});

it("refuses to change the unit of a product that has stock", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    await updateProduct(user, product.id, { unit: "KG" });
    await updateProduct(user, product.id, { unit: "UN" });
    await db
      .insert(inventoryBatches)
      .values(batch(product.id, "A", "2026-12-01", 14));

    await expect(
      updateProduct(user, product.id, { unit: "KG" }),
    ).rejects.toMatchObject({
      status: 409,
      options: { fields: { unit: expect.any(String) as string } },
    });
    await expect(
      updateProduct(user, product.id, { unit: "UN", sellPrice: 500 }),
    ).resolves.toMatchObject({ sellPrice: 500 });
  });
});

it("searches by name or barcode, taking wildcards literally", async () => {
  await inTest(async (db) => {
    const { category } = await seed(db);
    const tag = randomUUID();
    const base = {
      categoryId: category.id,
      costPrice: 100,
      sellPrice: 200,
      unit: "UN" as const,
    };
    await db.insert(products).values([
      { ...base, barcode: `${tag}-1`, name: `Café ${tag}` },
      { ...base, barcode: `${tag}-2`, name: `100% suco ${tag}` },
      { ...base, barcode: `${tag}-3`, name: `barra\\invertida ${tag}` },
    ]);
    const names = async (search: string) =>
      (await listProducts({ search, page: 1 })).products.map((p) => p.barcode);

    expect(await names(`CAFÉ ${tag}`)).toEqual([`${tag}-1`]);
    expect(await names(`${tag}-2`)).toEqual([`${tag}-2`]);
    expect(await names(`100% suco ${tag}`)).toEqual([`${tag}-2`]);
    // As wildcards, these would match every product.
    expect(await names("%%%")).toEqual([]);
    expect(await names("___")).toEqual([]);
    expect(await names(`barra\\invertida ${tag}`)).toEqual([`${tag}-3`]);
    expect(await names(`barrainvertida ${tag}`)).toEqual([]);
  });
});

it("pages through products in name order and answers the last page past the end", async () => {
  await inTest(async (db) => {
    const { category } = await seed(db);
    const tag = randomUUID();
    await db.insert(products).values(
      Array.from({ length: 21 }, (_, index) => ({
        barcode: `${tag}-${index}`,
        name: `${tag} ${String(index).padStart(2, "0")}`,
        categoryId: category.id,
        costPrice: 100,
        sellPrice: 200,
        unit: "UN" as const,
      })),
    );

    const first = await listProducts({ search: tag, page: 1 });
    expect(first).toMatchObject({ total: 21, page: 1, pageSize: 20 });
    expect(first.products).toHaveLength(20);
    expect(first.products[0].name).toBe(`${tag} 00`);

    const last = await listProducts({ search: tag, page: 2 });
    expect(last.products.map((p) => p.name)).toEqual([`${tag} 20`]);

    const past = await listProducts({ search: tag, page: 99 });
    expect(past).toMatchObject({ page: 2, total: 21 });
    expect(past.products).toHaveLength(1);

    const none = await listProducts({ search: randomUUID(), page: 3 });
    expect(none).toMatchObject({ products: [], total: 0, page: 1 });
  });
});

it("reports the batches of a product with the semaphore, in PVPS order", async () => {
  await inTest(async (db) => {
    const { product } = await seed(db);
    const search = product.barcode;
    const today = "2026-11-03";

    // No stock at all is red.
    let [row] = (await listInventory({ search, page: 1 }, today)).products;
    expect(row).toMatchObject({ stock: 0, signal: "red", batches: [] });

    await db
      .insert(inventoryBatches)
      .values([
        batch(product.id, "FAR", "2027-06-01", 10),
        { ...batch(product.id, "SEM", "2027-01-01", 5), expirationDate: null },
        batch(product.id, "EMPTY", "2026-01-01", 0),
      ]);
    [row] = (await listInventory({ search, page: 1 }, today)).products;
    expect(row.signal).toBe("green");
    expect(row.stock).toBe(15);
    // The empty, expired batch neither shows nor turns the product red.
    expect(row.batches.map((b) => b.batchCode)).toEqual(["FAR", "SEM"]);
    expect(row.batches[1]).toMatchObject({ daysLeft: null, signal: "green" });

    await db
      .insert(inventoryBatches)
      .values(batch(product.id, "MID", "2026-11-23", 1));
    [row] = (await listInventory({ search, page: 1 }, today)).products;
    expect(row.signal).toBe("yellow");
    expect(row.batches[0]).toMatchObject({
      batchCode: "MID",
      daysLeft: 20,
      signal: "yellow",
    });

    await db
      .insert(inventoryBatches)
      .values(batch(product.id, "OLD", "2026-11-01", 1));
    [row] = (await listInventory({ search, page: 1 }, today)).products;
    expect(row.signal).toBe("red");
    expect(row.batches[0]).toMatchObject({ daysLeft: -2, signal: "red" });
  });
});

it("turns a product yellow at the minimum stock", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    await db
      .insert(inventoryBatches)
      .values(batch(product.id, "A", "2027-06-01", 6));
    await updateProduct(user, product.id, { minStock: 6 });
    const { products: rows } = await listInventory(
      { search: product.barcode, page: 1 },
      "2026-11-03",
    );
    expect(rows[0].signal).toBe("yellow");
  });
});

it("answers an empty inventory page when nothing matches", async () => {
  await inTest(async () => {
    await expect(
      listInventory({ search: randomUUID(), page: 1 }),
    ).resolves.toMatchObject({ products: [], total: 0, page: 1 });
  });
});

it("adds up stock beyond the integer range", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    const limit = 2_147_483_647;
    await db
      .insert(inventoryBatches)
      .values([
        batch(product.id, "A", "2027-01-01", limit),
        batch(product.id, "B", "2027-02-01", limit),
      ]);
    const { products: rows } = await listProducts({
      search: product.barcode,
      page: 1,
    });
    expect(rows[0].stock).toBe(limit * 2);
    await expect(findProductForSale(product.barcode)).resolves.toMatchObject({
      stock: limit * 2,
    });
    await expect(
      consumeStock({
        productId: product.id,
        quantity: 1,
        reason: "Avaria",
        userId: user.id,
      }),
    ).resolves.toHaveLength(1);
  });
});

it("keeps the unit once a batch exists, even a used-up one", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    await db
      .insert(inventoryBatches)
      .values(batch(product.id, "A", "2027-01-01", 0));
    await expect(
      updateProduct(user, product.id, { unit: "KG" }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

it("asks for the minimum again when the unit changes", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    await updateProduct(user, product.id, { minStock: 10 });
    await expect(
      updateProduct(user, product.id, { unit: "KG" }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      updateProduct(user, product.id, { unit: "KG", minStock: 10000 }),
    ).resolves.toMatchObject({ unit: "KG", minStock: 10000 });
  });
});

it("leaves discontinued products out of the inventory once they hold nothing", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    const search = product.barcode;
    await db
      .insert(inventoryBatches)
      .values(batch(product.id, "USADO", "2027-01-01", 0));
    await updateProduct(user, product.id, { active: false });
    await expect(listInventory({ search, page: 1 })).resolves.toMatchObject({
      products: [],
      total: 0,
    });
    // Still on the products screen, so it can be reactivated.
    await expect(listProducts({ search, page: 1 })).resolves.toMatchObject({
      total: 1,
    });

    await db
      .insert(inventoryBatches)
      .values(batch(product.id, "A", "2027-06-01", 3));
    const page = await listInventory({ search, page: 1 }, "2026-11-03");
    expect(page.total).toBe(1);
    expect(page.products[0].active).toBe(false);
  });
});

it("logs which fields of a product changed, without their values", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    const name = `Renomeado ${randomUUID()}`;
    await updateProduct(user, product.id, { name, costPrice: 777 });
    const [entry] = await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, user.id));
    expect(entry.detail).toBe(`${name}: nome, custo`);
  });
});

it("lists batches of the same date by entry, as PVPS consumes them", async () => {
  await inTest(async (db) => {
    const { product } = await seed(db);
    await db.insert(inventoryBatches).values([
      {
        ...batch(product.id, "NOVO", "2027-01-01", 1),
        createdAt: new Date("2026-02-01T00:00:00Z"),
      },
      {
        ...batch(product.id, "ANTIGO", "2027-01-01", 1),
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
    ]);
    const { products: rows } = await listInventory(
      { search: product.barcode, page: 1 },
      "2026-11-03",
    );
    expect(rows[0].batches.map((b) => b.batchCode)).toEqual(["ANTIGO", "NOVO"]);
  });
});

it("reports errors when a product is changed to something invalid", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);
    const other = await seed(db);
    await expect(
      updateProduct(user, product.id, { categoryId: randomUUID() }),
    ).rejects.toMatchObject({ status: 422 });
    // Last: a violated constraint aborts the surrounding test transaction.
    await expect(
      updateProduct(user, product.id, { barcode: other.product.barcode }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

it("counts days from the store's date by default, not the server's", async () => {
  await inTest(async (db) => {
    const { product } = await seed(db);
    await db
      .insert(inventoryBatches)
      .values(batch(product.id, "A", "2026-11-04", 1));
    // Still the evening of Nov 3 in São Paulo, already Nov 4 in UTC.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-04T01:30:00Z"));
    try {
      const { products: rows } = await listInventory({
        search: product.barcode,
        page: 1,
      });
      expect(rows[0].batches[0].daysLeft).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
