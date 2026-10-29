import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const verificationPurpose = pgEnum("verification_purpose", [
  "signup",
  "password_reset",
]);

export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    purpose: verificationPurpose("purpose").notNull(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Data collected before verification (for example the signup form), applied once the code is consumed.
    payload: jsonb("payload"),
  },
  (table) => [
    index("verification_codes_email_purpose_idx").on(
      table.email,
      table.purpose,
    ),
  ],
);

export type VerificationPurpose =
  (typeof verificationPurpose.enumValues)[number];
