// Plain values shared with the database schema. Contracts reach client bundles, and the
// schema (table and column names, plus drizzle-orm itself) must not, so it imports from here.
export const USER_ROLES = ["ADMIN", "CASHIER"] as const;
export const PRODUCT_UNITS = ["UN", "KG", "L"] as const;
export const PAYMENT_METHODS = ["CASH", "PIX", "DEBIT", "CREDIT"] as const;
export const CASH_SESSION_STATUSES = ["OPEN", "CLOSED"] as const;
// BLEED = sangria (money taken out of the drawer), SUPPLY = suprimento (money put in).
export const CASH_MOVEMENT_TYPES = ["BLEED", "SUPPLY"] as const;
export const SESSION_IDLE_VALUES = ["1h", "8h", "24h", "never"] as const;
