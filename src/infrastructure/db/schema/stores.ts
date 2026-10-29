import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const SESSION_IDLE_VALUES = ["1h", "8h", "24h", "never"] as const;
export type SessionIdle = (typeof SESSION_IDLE_VALUES)[number];

// One row per installation: the UNIQUE on a constant-true column refuses a second store.
export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  singleton: boolean("singleton")
    .notNull()
    .default(true)
    .unique("stores_singleton"),
  name: text("name").notNull(),
  // CNPJ/CPF, digits only.
  document: text("document").notNull().default(""),
  phone: text("phone").notNull().default(""),
  kind: text("kind").notNull().default(""),
  address: text("address").notNull().default(""),
  sessionIdle: text("session_idle", { enum: SESSION_IDLE_VALUES })
    .notNull()
    .default("8h"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
