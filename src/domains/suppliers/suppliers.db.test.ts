import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { expect, it, vi } from "vitest";
import { createProduct, updateProduct } from "@/domains/inventory/service";
import {
  categories,
  inventoryBatches,
  products,
  productSuppliers,
  users,
} from "@/infrastructure/db/schema";
import { withTestDb, type TestDb } from "@/infrastructure/db/test-db";
import {
  countStockAlerts,
  createSupplier,
  getReplenishment,
  listSuppliers,
  updateSupplier,
} from "./service";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/activity/service", () => ({ logActivity: vi.fn() }));

// The repositories reach the database through getDb(); point it at the test database.
let current: TestDb;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

const inTest = (fn: (db: TestDb) => Promise<void>) =>
  withTestDb(async (db) => {
    current = db;
    await fn(db);
  });

const TODAY = "2026-11-05";

async function seed(db: TestDb) {
  const unique = randomUUID();
  const [user] = await db
    .insert(users)
    .values({ name: "Ana", email: `${unique}@example.com`, role: "ADMIN" })
    .returning();
  const [category] = await db
    .insert(categories)
    .values({ name: `Categoria ${unique}` })
    .returning();
  return { user, category, unique };
}

const supplier = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  document: "",
  phone: "",
  email: "",
  contactPerson: "",
  active: true,
  ...extra,
});

it("registers, finds and deactivates suppliers, refusing a repeated CNPJ/CPF", async () => {
  await inTest(async (db) => {
    const { user, unique } = await seed(db);
    const created = await createSupplier(
      user,
      supplier(`Distribuidora ${unique}`, {
        document: "11222333000181",
        phone: "11987654321",
        contactPerson: "Marcos",
      }),
    );
    expect(created).toMatchObject({
      document: "11222333000181",
      phone: "11987654321",
      active: true,
    });
    // Many suppliers may have no document at all.
    await createSupplier(user, supplier(`Feira ${unique}`));
    await createSupplier(user, supplier(`Sítio ${unique}`));

    const found = await listSuppliers({ search: "marcos", page: 1 });
    expect(found.suppliers.map((row) => row.id)).toContain(created.id);
    await expect(
      updateSupplier(user, created.id, { active: false }),
    ).resolves.toMatchObject({ active: false });
    await expect(
      updateSupplier(user, randomUUID(), { name: "Nada" }),
    ).rejects.toMatchObject({ status: 404 });
    // Last: a violated constraint aborts the surrounding test transaction.
    await expect(
      createSupplier(
        user,
        supplier(`Outra ${unique}`, { document: "11222333000181" }),
      ),
    ).rejects.toMatchObject({
      status: 409,
      options: { fields: { document: expect.any(String) } },
    });
  });
});

it("keeps one default supplier per product, with its code", async () => {
  await inTest(async (db) => {
    const { user, category, unique } = await seed(db);
    const first = await createSupplier(user, supplier(`A ${unique}`));
    const second = await createSupplier(user, supplier(`B ${unique}`));
    const product = await createProduct(user, {
      barcode: unique,
      name: "Café",
      categoryId: category.id,
      costPrice: 1290,
      sellPrice: 1849,
      minStock: 6,
      unit: "UN",
      active: true,
      defaultSupplierId: first.id,
      supplierCode: "CF-500",
    });
    expect(product).toMatchObject({
      defaultSupplierId: first.id,
      supplierCode: "CF-500",
    });

    const moved = await updateProduct(user, product.id, {
      defaultSupplierId: second.id,
    });
    expect(moved).toMatchObject({
      defaultSupplierId: second.id,
      // A code belongs to its supplier: the new default has none yet.
      supplierCode: "",
    });
    const defaults = await db
      .select({ supplierId: productSuppliers.supplierId })
      .from(productSuppliers)
      .where(
        and(
          eq(productSuppliers.productId, product.id),
          eq(productSuppliers.isDefault, true),
        ),
      );
    expect(defaults).toEqual([{ supplierId: second.id }]);

    await expect(
      updateProduct(user, product.id, { defaultSupplierId: null }),
    ).resolves.toMatchObject({ defaultSupplierId: null, supplierCode: "" });

    // An inactive supplier cannot be chosen anew.
    await updateSupplier(user, first.id, { active: false });
    await expect(
      updateProduct(user, product.id, { defaultSupplierId: first.id }),
    ).rejects.toMatchObject({
      status: 422,
      options: { fields: { defaultSupplierId: expect.any(String) } },
    });
  });
});

it("suggests what to buy for low or expiring products, grouped by default supplier", async () => {
  await inTest(async (db) => {
    const { user, category, unique } = await seed(db);
    const zeta = await createSupplier(
      user,
      supplier(`Zeta ${unique}`, { phone: "11987654321" }),
    );
    const alfa = await createSupplier(user, supplier(`Alfa ${unique}`));
    const gone = await createSupplier(
      user,
      supplier(`Antiga ${unique}`, { active: false }),
    );
    const product = async (
      name: string,
      minStock: number,
      batches: [string | null, number][],
      extra: Partial<typeof products.$inferInsert> = {},
    ) => {
      const [row] = await db
        .insert(products)
        .values({
          barcode: `${unique}-${name}`,
          name: `${name} ${unique}`,
          categoryId: category.id,
          costPrice: 100,
          sellPrice: 200,
          unit: "UN",
          minStock,
          ...extra,
        })
        .returning();
      for (const [expirationDate, quantity] of batches)
        await db.insert(inventoryBatches).values({
          productId: row.id,
          batchCode: "L",
          expirationDate,
          quantity,
        });
      return row;
    };
    const link = (productId: string, supplierId: string, code = "") =>
      db.insert(productSuppliers).values({
        productId,
        supplierId,
        isDefault: true,
        supplierCode: code,
      });

    // At the minimum: 2 × 5 − 5 = 5 to buy.
    const low = await product("Arroz", 5, [["2027-06-01", 5]]);
    await link(low.id, zeta.id, "ARZ-5");
    // Plenty of stock, but a batch expires in 20 days: listed, nothing to buy.
    const expiring = await product("Iogurte", 2, [["2026-11-25", 10]]);
    await link(expiring.id, alfa.id);
    // Expired batch still on the shelf: listed (red).
    const expired = await product("Leite", 1, [["2026-11-01", 4]]);
    await link(expired.id, gone.id);
    // Healthy: not listed. Inactive product: not listed.
    await product("Feijão", 2, [["2027-06-01", 30]]);
    await product("Velho", 5, [], { active: false });
    // Weighed, empty, without a supplier: 2 × 1,000 kg to buy.
    const banana = await product("Banana", 1000, [], { unit: "KG" });

    const { groups } = await getReplenishment(TODAY);
    const ours = groups
      .map((group) => ({
        supplier: group.supplier?.name ?? null,
        items: group.items
          .filter((item) => item.name.endsWith(unique))
          .map((item) => [
            item.name.split(" ")[0],
            item.suggested,
            item.signal,
          ]),
      }))
      .filter((group) => group.items.length > 0);

    expect(ours).toEqual([
      { supplier: `Alfa ${unique}`, items: [["Iogurte", 0, "yellow"]] },
      { supplier: `Zeta ${unique}`, items: [["Arroz", 5, "yellow"]] },
      // The inactive supplier takes no orders: its product joins the ones without one.
      {
        supplier: null,
        items: [
          ["Banana", 2000, "red"],
          ["Leite", 0, "red"],
        ],
      },
    ]);
    const arroz = groups
      .flatMap((group) => group.items)
      .find((item) => item.productId === low.id);
    expect(arroz).toMatchObject({
      supplierCode: "ARZ-5",
      nearestExpiration: "2027-06-01",
      stock: 5,
      minStock: 5,
    });
    const leite = groups
      .flatMap((group) => group.items)
      .find((item) => item.productId === expired.id);
    expect(leite).toMatchObject({
      daysLeft: -4,
      nearestExpiration: "2026-11-01",
    });
    expect(
      groups.flatMap((group) => group.items).map((item) => item.productId),
    ).toContain(banana.id);
  });
});

it("counts for the header the products needing attention now: low stock or expiring within 7 days", async () => {
  await inTest(async (db) => {
    const { category, unique } = await seed(db);
    const product = async (
      name: string,
      minStock: number,
      batches: [string | null, number][],
    ) => {
      const [row] = await db
        .insert(products)
        .values({
          barcode: `${unique}-${name}`,
          name: `${name} ${unique}`,
          categoryId: category.id,
          costPrice: 100,
          sellPrice: 200,
          unit: "UN",
          minStock,
        })
        .returning();
      for (const [expirationDate, quantity] of batches)
        await db.insert(inventoryBatches).values({
          productId: row.id,
          batchCode: "L",
          expirationDate,
          quantity,
        });
    };
    const before = await countStockAlerts(TODAY);
    // Empty; at the minimum; a batch expiring in 5 days: three alerts.
    await product("Vazio", 0, []);
    await product("Minimo", 5, [["2027-06-01", 5]]);
    await product("Iogurte", 1, [["2026-11-10", 9]]);
    // Expiring in 20 days, with plenty of stock: in the replenishment list, not in the alert.
    await product("Queijo", 1, [["2026-11-25", 9]]);
    await product("Arroz", 1, [["2027-06-01", 9]]);
    expect((await countStockAlerts(TODAY)) - before).toBe(3);
  });
});
