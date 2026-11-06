import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { products } from "./inventory";

// Who the store buys from. Document (CNPJ/CPF) and phone are digits only; phone is the WhatsApp.
export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    // CNPJ or CPF.
    document: text("cnpj_cpf").notNull().default(""),
    phone: text("phone").notNull().default(""),
    email: text("email").notNull().default(""),
    contactPerson: text("contact_person").notNull().default(""),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // The same CNPJ/CPF twice would split one supplier's orders; many suppliers may have none.
    uniqueIndex("suppliers_cnpj_cpf_unique")
      .on(table.document)
      .where(sql`${table.document} <> ''`),
    index("suppliers_name_idx").on(table.name),
  ],
);

// Which suppliers sell a product, and the code the supplier uses for it.
export const productSuppliers = pgTable(
  "product_suppliers",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    isDefault: boolean("is_default").notNull().default(false),
    supplierCode: text("supplier_code").notNull().default(""),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.supplierId] }),
    // At most one default supplier per product: the one its replenishment order goes to.
    uniqueIndex("product_suppliers_one_default")
      .on(table.productId)
      .where(sql`${table.isDefault}`),
    index("product_suppliers_supplier_idx").on(table.supplierId),
  ],
);
