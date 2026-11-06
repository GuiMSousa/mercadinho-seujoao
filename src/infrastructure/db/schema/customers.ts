import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { CUSTOMER_TRANSACTION_TYPES } from "../../../contracts/enums";
import { sales } from "./sales";
import { users } from "./users";

export const customerTransactionType = pgEnum(
  "customer_transaction_type",
  CUSTOMER_TRANSACTION_TYPES,
);

// Who buys on account (fiado). Amounts in integer cents; document (CPF/CNPJ) and phone are digits.
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    document: text("cpf_cnpj").notNull().default(""),
    phone: text("phone").notNull().default(""),
    creditLimit: integer("credit_limit").notNull().default(0),
    // Kept in step with customer_transactions in the same transaction; never read-modify-written.
    currentDebt: integer("current_debt").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("customers_cpf_cnpj_unique")
      .on(table.document)
      .where(sql`${table.document} <> ''`),
    index("customers_name_idx").on(table.name),
    // The limit may drop below the debt (no new fiado then); neither goes negative.
    check(
      "customers_amounts_valid",
      sql`${table.creditLimit} >= 0 AND ${table.currentDebt} >= 0`,
    ),
  ],
);

// The customer's statement: each purchase on account and each payment, as it happened.
export const customerTransactions = pgTable(
  "customer_transactions",
  {
    // Chosen by the client for a payment: repeating it after a lost response records it once.
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    // The sale behind a DEBIT; a sale has at most one fiado payment.
    saleId: uuid("sale_id").references(() => sales.id),
    type: customerTransactionType("type").notNull(),
    amount: integer("amount").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("customer_transactions_customer_idx").on(
      table.customerId,
      table.createdAt,
    ),
    uniqueIndex("customer_transactions_sale_unique").on(table.saleId),
    check("customer_transactions_amount_positive", sql`${table.amount} > 0`),
  ],
);
