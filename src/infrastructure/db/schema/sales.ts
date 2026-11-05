import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { PAYMENT_METHODS } from "../../../contracts/enums";
import { productUnit, products } from "./inventory";
import { users } from "./users";

export const paymentMethod = pgEnum("payment_method", PAYMENT_METHODS);

// Amounts in integer cents. Without cash, the amount received is the total and there is no change.
export const sales = pgTable(
  "sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Short number printed on the receipt; the id stays the key.
    number: integer("number").generatedAlwaysAsIdentity().notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    paymentMethod: paymentMethod("payment_method").notNull(),
    total: integer("total").notNull(),
    amountReceived: integer("amount_received").notNull(),
    change: integer("change").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sales_created_at_idx").on(table.createdAt),
    check(
      "sales_amounts_consistent",
      sql`${table.total} >= 0 AND ${table.amountReceived} >= ${table.total} AND ${table.change} = ${table.amountReceived} - ${table.total}`,
    ),
  ],
);

// Name, prices and cost as they were at the sale: the receipt and the CMV must not follow catalog edits.
// Quantities are in the unit's base (units, grams, milliliters); unit prices per UN, kg or L.
export const saleItems = pgTable(
  "sale_items",
  {
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id),
    line: integer("line").notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    name: text("name").notNull(),
    unit: productUnit("unit").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    unitCost: integer("unit_cost").notNull(),
    total: integer("total").notNull(),
    cost: integer("cost").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.saleId, table.line] }),
    check(
      "sale_items_values_valid",
      sql`${table.quantity} > 0 AND ${table.unitPrice} >= 0 AND ${table.unitCost} >= 0 AND ${table.total} >= 0 AND ${table.cost} >= 0`,
    ),
  ],
);
