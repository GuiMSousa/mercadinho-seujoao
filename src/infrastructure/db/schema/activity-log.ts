import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Kept (as null) when the user is deleted; userName preserves who did it.
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    userName: text("user_name").notNull(),
    action: text("action").notNull(),
    detail: text("detail").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("activity_log_created_at_idx").on(table.createdAt.desc())],
);
