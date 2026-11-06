// Plain values shared with the database schema. Contracts reach client bundles, and the
// schema (table and column names, plus drizzle-orm itself) must not, so it imports from here.
export const USER_ROLES = ["ADMIN", "CASHIER"] as const;
export const PRODUCT_UNITS = ["UN", "KG", "L"] as const;
// IN = a batch received, OUT = a sale (PVPS) or a manual write-off, ADJUSTMENT = a stock correction.
export const INVENTORY_MOVEMENT_TYPES = ["IN", "OUT", "ADJUSTMENT"] as const;
// ON_ACCOUNT = fiado: the customer's debt grows by the amount, to be paid later.
// MEAL_VOUCHER = vale-refeição (VR), FOOD_VOUCHER = vale-alimentação (VA). New values go last:
// PostgreSQL appends enum values, and the reports list the methods in this order.
export const PAYMENT_METHODS = [
  "CASH",
  "PIX",
  "DEBIT",
  "CREDIT",
  "ON_ACCOUNT",
  "MEAL_VOUCHER",
  "FOOD_VOUCHER",
] as const;
// DEBIT = a purchase on account (fiado), PAYMENT = money the customer paid towards the debt.
export const CUSTOMER_TRANSACTION_TYPES = ["DEBIT", "PAYMENT"] as const;
export const CASH_SESSION_STATUSES = ["OPEN", "CLOSED"] as const;
// BLEED = sangria (money taken out of the drawer), SUPPLY = suprimento (money put in).
export const CASH_MOVEMENT_TYPES = ["BLEED", "SUPPLY"] as const;
export const SESSION_IDLE_VALUES = ["1h", "8h", "24h", "never"] as const;
