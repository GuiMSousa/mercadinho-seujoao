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
import { cashSessions } from "./cash";
import { customers } from "./customers";
import { productUnit, products } from "./inventory";
import { users } from "./users";

export const paymentMethod = pgEnum("payment_method", PAYMENT_METHODS);

// Amounts in integer cents. The amount received is everything handed over (the payments plus the
// change); only cash can exceed its share, and the excess is the change.
export const sales = pgTable(
  "sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Short number printed on the receipt; the id stays the key.
    number: integer("number").generatedAlwaysAsIdentity().notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    // The drawer the sale went into. Null only for sales made before the cash register existed.
    cashSessionId: uuid("cash_session_id").references(() => cashSessions.id),
    // The fiado customer; null when nothing went on account.
    customerId: uuid("customer_id").references(() => customers.id),
    // Taken off the sum of the lines; `total` is what the customer pays.
    discount: integer("discount_amount").notNull().default(0),
    total: integer("total").notNull(),
    amountReceived: integer("amount_received").notNull(),
    change: integer("change").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sales_created_at_idx").on(table.createdAt),
    index("sales_cash_session_idx").on(table.cashSessionId),
    check(
      "sales_amounts_consistent",
      sql`${table.total} >= 0 AND ${table.amountReceived} >= ${table.total} AND ${table.change} = ${table.amountReceived} - ${table.total}`,
    ),
    check("sales_discount_not_negative", sql`${table.discount} >= 0`),
  ],
);

// How the total was paid: one row per method, the amounts summing to the sale's total. A cash row
// holds what stayed in the drawer (handed over minus the change).
export const salePayments = pgTable(
  "sale_payments",
  {
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id),
    method: paymentMethod("method").notNull(),
    amount: integer("amount").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.saleId, table.method] }),
    check("sale_payments_amount_positive", sql`${table.amount} > 0`),
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
    // Taken off this line only; `total` is the line after it (unit price × quantity − discount).
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),
    cost: integer("cost").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.saleId, table.line] }),
    check(
      "sale_items_values_valid",
      sql`${table.quantity} > 0 AND ${table.unitPrice} >= 0 AND ${table.unitCost} >= 0 AND ${table.total} >= 0 AND ${table.cost} >= 0 AND ${table.discount} >= 0`,
    ),
  ],
);
