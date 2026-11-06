import { randomUUID } from "node:crypto";
import { expect, it, vi } from "vitest";
import {
  categories,
  inventoryBatches,
  inventoryMovements,
  products,
  users,
} from "@/infrastructure/db/schema";
import { withTestDb, type TestDb } from "@/infrastructure/db/test-db";
import { listMovements } from "./history";

vi.mock("server-only", () => ({}));

// The repositories reach the database through getDb(); point it at the test database.
let current: TestDb;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

it("lists movements newest first, by product, type and the store's calendar days", async () => {
  await withTestDb(async (db) => {
    current = db;
    const unique = randomUUID().slice(0, 8);
    const [user] = await db
      .insert(users)
      .values({ name: "Ana", email: `${unique}@example.com`, role: "ADMIN" })
      .returning();
    const [category] = await db
      .insert(categories)
      .values({ name: `Categoria ${unique}` })
      .returning();
    const [coffee, rice] = await db
      .insert(products)
      .values(
        ["cafe", "arroz"].map((code) => ({
          barcode: `${unique}-${code}`,
          name: `${code === "cafe" ? "Café" : "Arroz"} ${unique}`,
          categoryId: category.id,
          costPrice: 100,
          sellPrice: 200,
          unit: "UN" as const,
        })),
      )
      .returning();
    const [batch] = await db
      .insert(inventoryBatches)
      .values({ productId: coffee.id, batchCode: "L1", quantity: 7 })
      .returning();
    const movement = (
      productId: string,
      type: "IN" | "OUT",
      quantity: number,
      reason: string,
      at: string,
    ) => ({
      productId,
      batchId: productId === coffee.id ? batch.id : null,
      type,
      quantity,
      reason,
      userId: user.id,
      createdAt: new Date(at),
    });
    await db.insert(inventoryMovements).values([
      // 09/03 23:30 in the store, already 10/03 in UTC.
      movement(coffee.id, "IN", 10, "", "2020-03-10T02:30:00Z"),
      movement(coffee.id, "OUT", 2, "Venda nº 1", "2020-03-10T13:00:00Z"),
      movement(coffee.id, "OUT", 1, "Avariado", "2020-03-10T15:00:00Z"),
      movement(rice.id, "IN", 4, "", "2020-03-11T13:00:00Z"),
    ]);

    const all = await listMovements({ search: unique, page: 1 });
    expect(all.total).toBe(4);
    expect(
      all.movements.map((row) => [
        row.productName.split(" ")[0],
        row.type,
        row.quantity,
        row.reason,
      ]),
    ).toEqual([
      ["Arroz", "IN", 4, ""],
      ["Café", "OUT", 1, "Avariado"],
      ["Café", "OUT", 2, "Venda nº 1"],
      ["Café", "IN", 10, ""],
    ]);
    expect(all.movements[1]).toMatchObject({
      batchCode: "L1",
      userName: "Ana",
      barcode: `${unique}-cafe`,
      unit: "UN",
    });

    const outOnTenth = await listMovements({
      search: `${unique}-cafe`,
      type: "OUT",
      from: "2020-03-10",
      to: "2020-03-10",
      page: 1,
    });
    expect(outOnTenth.movements.map((row) => row.quantity)).toEqual([1, 2]);
    // The 23:30 entry belongs to the store's 9th.
    const ninth = await listMovements({
      search: unique,
      from: "2020-03-09",
      to: "2020-03-09",
      page: 1,
    });
    expect(ninth.movements.map((row) => row.quantity)).toEqual([10]);
    // A page past the end answers the last one.
    expect((await listMovements({ search: unique, page: 9 })).page).toBe(1);
  });
});
