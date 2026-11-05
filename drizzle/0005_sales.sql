CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'PIX', 'DEBIT', 'CREDIT');--> statement-breakpoint
CREATE TABLE "sale_items" (
	"sale_id" uuid NOT NULL,
	"line" integer NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"unit" "product_unit" NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"unit_cost" integer NOT NULL,
	"total" integer NOT NULL,
	"cost" integer NOT NULL,
	CONSTRAINT "sale_items_sale_id_line_pk" PRIMARY KEY("sale_id","line"),
	CONSTRAINT "sale_items_values_valid" CHECK ("sale_items"."quantity" > 0 AND "sale_items"."unit_price" >= 0 AND "sale_items"."unit_cost" >= 0 AND "sale_items"."total" >= 0 AND "sale_items"."cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "sales_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"total" integer NOT NULL,
	"amount_received" integer NOT NULL,
	"change" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_number_unique" UNIQUE("number"),
	CONSTRAINT "sales_amounts_consistent" CHECK ("sales"."total" >= 0 AND "sales"."amount_received" >= "sales"."total" AND "sales"."change" = "sales"."amount_received" - "sales"."total")
);
--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sales_created_at_idx" ON "sales" USING btree ("created_at");