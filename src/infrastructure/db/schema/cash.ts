import { sql } from "drizzle-orm";
import {
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
import {
  CASH_MOVEMENT_TYPES,
  CASH_SESSION_STATUSES,
} from "../../../contracts/enums";
import { users } from "./users";

export const cashSessionStatus = pgEnum(
  "cash_session_status",
  CASH_SESSION_STATUSES,
);
export const cashMovementType = pgEnum(
  "cash_movement_type",
  CASH_MOVEMENT_TYPES,
);

// The store's cash drawer from opening to closing. Amounts in integer cents.
export const cashSessions = pgTable(
  "cash_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Who opened it; who closed it is in the activity log.
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    openedAt: timestamp("opened_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    initialAmount: integer("initial_amount").notNull(),
    // Set on closing: what the system expected, what was counted, and actual minus expected.
    expectedAmount: integer("expected_amount"),
    actualAmount: integer("actual_amount"),
    difference: integer("difference"),
    status: cashSessionStatus("status").notNull().default("OPEN"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // A single drawer per store (PRODUCT.md): at most one session open at a time.
    uniqueIndex("cash_sessions_one_open")
      .on(table.status)
      .where(sql`${table.status} = 'OPEN'`),
    index("cash_sessions_opened_at_idx").on(table.openedAt),
    check(
      "cash_sessions_initial_not_negative",
      sql`${table.initialAmount} >= 0`,
    ),
    check(
      "cash_sessions_closing_consistent",
      sql`(${table.status} = 'OPEN' AND ${table.closedAt} IS NULL AND ${table.expectedAmount} IS NULL AND ${table.actualAmount} IS NULL AND ${table.difference} IS NULL) OR (${table.status} = 'CLOSED' AND ${table.closedAt} IS NOT NULL AND ${table.expectedAmount} IS NOT NULL AND ${table.actualAmount} >= 0 AND ${table.difference} = ${table.actualAmount} - ${table.expectedAmount})`,
    ),
  ],
);

// Sangria (BLEED) and suprimento (SUPPLY), always with the reason.
export const cashMovements = pgTable(
  "cash_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cashSessionId: uuid("cash_session_id")
      .notNull()
      .references(() => cashSessions.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: cashMovementType("type").notNull(),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("cash_movements_session_idx").on(table.cashSessionId),
    check("cash_movements_amount_positive", sql`${table.amount} > 0`),
    check(
      "cash_movements_reason_present",
      sql`length(trim(${table.reason})) > 0`,
    ),
  ],
);
