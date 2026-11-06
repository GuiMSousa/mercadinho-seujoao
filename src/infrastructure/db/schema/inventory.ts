import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { PRODUCT_UNITS } from "../../../contracts/enums";
import { users } from "./users";

export const productUnit = pgEnum("product_unit", PRODUCT_UNITS);
export const inventoryMovementType = pgEnum("inventory_movement_type", [
  "IN",
  "OUT",
  "ADJUSTMENT",
]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Quantities are integers in the unit's base: UN = units, KG = grams, L = milliliters.
// Prices are integer cents per UN, per kg or per L.
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    barcode: text("barcode").notNull().unique(),
    name: text("name").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    costPrice: integer("cost_price").notNull(),
    sellPrice: integer("sell_price").notNull(),
    minStock: integer("min_stock").notNull().default(0),
    unit: productUnit("unit").notNull(),
    active: boolean("active").notNull().default(true),
  },
  (table) => [
    check(
      "products_values_not_negative",
      sql`${table.costPrice} >= 0 AND ${table.sellPrice} >= 0 AND ${table.minStock} >= 0`,
    ),
  ],
);

export const inventoryBatches = pgTable(
  "inventory_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    batchCode: text("batch_code").notNull(),
    // Null means the item does not expire (PRODUCT.md); such a batch goes out last.
    expirationDate: date("expiration_date"),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inventory_batches_pvps_idx").on(
      table.productId,
      table.expirationDate,
    ),
    check(
      "inventory_batches_quantity_not_negative",
      sql`${table.quantity} >= 0`,
    ),
  ],
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    batchId: uuid("batch_id").references(() => inventoryBatches.id),
    type: inventoryMovementType("type").notNull(),
    quantity: integer("quantity").notNull(),
    reason: text("reason").notNull().default(""),
    // The write-off these movements belong to, chosen by the client: a repeated id is a retry.
    operationId: uuid("operation_id"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inventory_movements_product_idx").on(
      table.productId,
      table.createdAt.desc(),
    ),
    index("inventory_movements_operation_idx").on(table.operationId),
  ],
);
