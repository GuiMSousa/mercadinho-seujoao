CREATE TYPE "public"."customer_transaction_type" AS ENUM('DEBIT', 'PAYMENT');--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'ON_ACCOUNT';--> statement-breakpoint
CREATE TABLE "sale_payments" (
	"sale_id" uuid NOT NULL,
	"method" "payment_method" NOT NULL,
	"amount" integer NOT NULL,
	CONSTRAINT "sale_payments_sale_id_method_pk" PRIMARY KEY("sale_id","method"),
	CONSTRAINT "sale_payments_amount_positive" CHECK ("sale_payments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "customer_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"sale_id" uuid,
	"type" "customer_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_transactions_amount_positive" CHECK ("customer_transactions"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cpf_cnpj" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"credit_limit" integer DEFAULT 0 NOT NULL,
	"current_debt" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_amounts_valid" CHECK ("customers"."credit_limit" >= 0 AND "customers"."current_debt" >= 0)
);
--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "discount_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_transactions" ADD CONSTRAINT "customer_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_transactions" ADD CONSTRAINT "customer_transactions_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_transactions" ADD CONSTRAINT "customer_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_transactions_customer_idx" ON "customer_transactions" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_transactions_sale_unique" ON "customer_transactions" USING btree ("sale_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_cpf_cnpj_unique" ON "customers" USING btree ("cpf_cnpj") WHERE "customers"."cpf_cnpj" <> '';--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_discount_not_negative" CHECK ("sales"."discount_amount" >= 0);--> statement-breakpoint
-- Every sale made so far was paid with one method; it becomes that sale's one payment row.
INSERT INTO "sale_payments" ("sale_id", "method", "amount") SELECT "id", "payment_method", "total" FROM "sales" WHERE "total" > 0;