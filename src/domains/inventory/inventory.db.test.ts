import { randomUUID } from "node:crypto";
import { asc, eq, inArray } from "drizzle-orm";
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
    const movements = await db.select().from(inventoryMovements);
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
    expect(await db.select().from(inventoryMovements)).toHaveLength(2);
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
    expect(await db.select().from(inventoryMovements)).toHaveLength(0);
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

it("lets only one of two concurrent sales spend the same stock", async () => {
  await withTestPool(async (db) => {
    current = db;
    const { user, category, product } = await seed(db);
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

      const results = await Promise.allSettled([sale(), sale()]);

      expect(results.map((result) => result.status).sort()).toEqual([
        "fulfilled",
        "rejected",
      ]);
      const total = (await quantities(db, product.id)).reduce(
        (sum, quantity) => sum + quantity,
        0,
      );
      expect(total).toBe(3);
    } finally {
      await db
        .delete(inventoryMovements)
        .where(eq(inventoryMovements.productId, product.id));
      await db
        .delete(inventoryBatches)
        .where(eq(inventoryBatches.productId, product.id));
      await db.delete(products).where(eq(products.id, product.id));
      await db.delete(categories).where(eq(categories.id, category.id));
      await db.delete(users).where(inArray(users.id, [user.id]));
    }
  });
});

it("records a received batch with its IN movement and counts it as stock", async () => {
  await inTest(async (db) => {
    const { user, product } = await seed(db);

    const received = await receiveBatch(user.id, product.id, {
      batchCode: "L-1",
      expirationDate: "2026-12-01",
      quantity: 8,
    });

    expect(received).toMatchObject({ batchCode: "L-1", quantity: 8 });
    const [movement] = await db.select().from(inventoryMovements);
    expect(movement).toMatchObject({
      batchId: received.id,
      type: "IN",
      quantity: 8,
      userId: user.id,
    });
    const rows = await listProducts();
    expect(rows.find((row) => row.id === product.id)?.stock).toBe(8);
    await expect(
      receiveBatch(user.id, randomUUID(), {
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
      .where(eq(activityLog.detail, "Café"));
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
