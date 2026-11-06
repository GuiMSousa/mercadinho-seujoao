CREATE TABLE "product_suppliers" (
	"product_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"supplier_code" text DEFAULT '' NOT NULL,
	CONSTRAINT "product_suppliers_product_id_supplier_id_pk" PRIMARY KEY("product_id","supplier_id")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cnpj_cpf" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"contact_person" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "operation_id" uuid;--> statement-breakpoint
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_suppliers_one_default" ON "product_suppliers" USING btree ("product_id") WHERE "product_suppliers"."is_default";--> statement-breakpoint
CREATE INDEX "product_suppliers_supplier_idx" ON "product_suppliers" USING btree ("supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_cnpj_cpf_unique" ON "suppliers" USING btree ("cnpj_cpf") WHERE "suppliers"."cnpj_cpf" <> '';--> statement-breakpoint
CREATE INDEX "suppliers_name_idx" ON "suppliers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "inventory_movements_operation_idx" ON "inventory_movements" USING btree ("operation_id");