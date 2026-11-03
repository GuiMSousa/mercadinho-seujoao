import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { USER_ROLES } from "../../../contracts/enums";

export const userRole = pgEnum("user_role", USER_ROLES);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    // Always stored lowercase (see loginRequestSchema), so the unique index is case-insensitive in practice.
    email: text("email").notNull().unique(),
    // Null until the person sets a password (invited or not yet activated).
    passwordHash: text("password_hash"),
    role: userRole("role").notNull(),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("users_email_lowercase", sql`${table.email} = lower(${table.email})`),
  ],
);

export type Role = (typeof userRole.enumValues)[number];
