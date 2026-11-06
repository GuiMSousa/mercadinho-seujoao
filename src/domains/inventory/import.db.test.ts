import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { expect, it, vi } from "vitest";
import { logActivity } from "@/domains/activity/service";
import {
  categories,
  inventoryBatches,
  products,
  users,
} from "@/infrastructure/db/schema";
import { withTestDb, type TestDb } from "@/infrastructure/db/test-db";
import { importProducts } from "./product-import";

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

const HEADER =
  "Nome;Código de barras;Categoria;Preço custo;Preço venda;Unidade;Estoque mínimo";

async function seed(db: TestDb) {
  const unique = randomUUID().slice(0, 8);
  const [user] = await db
    .insert(users)
    .values({ name: "Ana", email: `${unique}@example.com`, role: "ADMIN" })
    .returning();
  const [category] = await db
    .insert(categories)
    .values({ name: `Mercearia ${unique}` })
    .returning();
  // Already in the catalog, with a batch: its unit can no longer change.
  const [coffee] = await db
    .insert(products)
    .values({
      barcode: `${unique}-cafe`,
      name: "Café velho",
      categoryId: category.id,
      costPrice: 1000,
      sellPrice: 1500,
      unit: "UN",
    })
    .returning();
  await db
    .insert(inventoryBatches)
    .values({ productId: coffee.id, batchCode: "A", quantity: 5 });
  return { user, category, coffee, unique };
}

const byBarcode = (db: TestDb, barcodes: string[]) =>
  db
    .select({
      barcode: products.barcode,
      name: products.name,
      categoryId: products.categoryId,
      costPrice: products.costPrice,
      sellPrice: products.sellPrice,
      unit: products.unit,
      minStock: products.minStock,
    })
    .from(products)
    .where(inArray(products.barcode, barcodes));

it("creates new products, updates known barcodes and the missing categories, all at once", async () => {
  await inTest(async (db) => {
    const { user, category, coffee, unique } = await seed(db);
    const csv = [
      HEADER,
      // The known category spelled in other case; the café's barcode updates it.
      `Café 500 g;${coffee.barcode};${category.name.toUpperCase()};12,90;18,49;UN;6`,
      `Banana prata;${unique}-banana;Hortifrúti ${unique};4.00;6.99;kg;2,500`,
      `"Leite; integral";${unique}-leite;Hortifrúti ${unique};3,10;4,99;L;`,
    ].join("\r\n");

    await expect(importProducts(user, csv)).resolves.toEqual({
      inserted: 2,
      updated: 1,
      categoriesCreated: 1,
    });
    const rows = await byBarcode(db, [
      coffee.barcode,
      `${unique}-banana`,
      `${unique}-leite`,
    ]);
    expect(rows.find((row) => row.barcode === coffee.barcode)).toMatchObject({
      name: "Café 500 g",
      categoryId: category.id,
      costPrice: 1290,
      sellPrice: 1849,
      minStock: 6,
    });
    expect(
      rows.find((row) => row.barcode === `${unique}-banana`),
    ).toMatchObject({
      unit: "KG",
      costPrice: 400,
      sellPrice: 699,
      minStock: 2500,
    });
    expect(rows.find((row) => row.barcode === `${unique}-leite`)).toMatchObject(
      { name: "Leite; integral", unit: "L", minStock: 0 },
    );
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "Produtos importados",
        detail: "2 novos, 1 alterado",
      }),
    );
  });
});

it("writes nothing when any line has a problem, and names every line", async () => {
  await inTest(async (db) => {
    const { user, coffee, unique } = await seed(db);
    const csv = [
      HEADER,
      `Arroz;${unique}-arroz;Mercearia;20,00;29,90;UN;3`,
      `;${unique}-feijao;Mercearia;abc;8,99;CX;1`,
      `Arroz de novo;${unique}-arroz;Mercearia;20,00;29,90;UN;3`,
    ].join("\n");

    await expect(importProducts(user, csv)).rejects.toMatchObject({
      status: 422,
      options: {
        fields: {
          "3": "Informe o nome. A unidade é UN, KG ou L. Preço de custo inválido. Ex.: 12,90",
          "4": "Código de barras repetido (linha 2).",
        },
      },
    });
    expect(await byBarcode(db, [`${unique}-arroz`])).toEqual([]);

    // A known product that has batches keeps its unit.
    await expect(
      importProducts(
        user,
        `${HEADER}\nCafé;${coffee.barcode};Mercearia;12,90;18,49;KG;1`,
      ),
    ).rejects.toMatchObject({
      status: 422,
      options: { fields: { "2": expect.stringContaining("unidade") } },
    });
    const [kept] = await db
      .select({ unit: products.unit, name: products.name })
      .from(products)
      .where(eq(products.id, coffee.id));
    expect(kept).toEqual({ unit: "UN", name: "Café velho" });
    await expect(
      importProducts(user, "nome;preco\nCafé;1,00"),
    ).rejects.toMatchObject({
      status: 422,
      options: {
        fields: { "1": expect.stringContaining("Faltam as colunas") },
      },
    });
  });
});
