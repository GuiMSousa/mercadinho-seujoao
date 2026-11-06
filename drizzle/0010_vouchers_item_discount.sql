ALTER TYPE "public"."payment_method" ADD VALUE 'MEAL_VOUCHER';--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'FOOD_VOUCHER';--> statement-breakpoint
ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_values_valid";--> statement-breakpoint
ALTER TABLE "sale_items" ADD COLUMN "discount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_values_valid" CHECK ("sale_items"."quantity" > 0 AND "sale_items"."unit_price" >= 0 AND "sale_items"."unit_cost" >= 0 AND "sale_items"."total" >= 0 AND "sale_items"."cost" >= 0 AND "sale_items"."discount" >= 0);