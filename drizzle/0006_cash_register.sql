CREATE TYPE "public"."cash_movement_type" AS ENUM('BLEED', 'SUPPLY');--> statement-breakpoint
CREATE TYPE "public"."cash_session_status" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
CREATE TABLE "cash_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cash_session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "cash_movement_type" NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cash_movements_amount_positive" CHECK ("cash_movements"."amount" > 0),
	CONSTRAINT "cash_movements_reason_present" CHECK (length(trim("cash_movements"."reason")) > 0)
);
--> statement-breakpoint
CREATE TABLE "cash_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"initial_amount" integer NOT NULL,
	"expected_amount" integer,
	"actual_amount" integer,
	"difference" integer,
	"status" "cash_session_status" DEFAULT 'OPEN' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cash_sessions_initial_not_negative" CHECK ("cash_sessions"."initial_amount" >= 0),
	CONSTRAINT "cash_sessions_closing_consistent" CHECK (("cash_sessions"."status" = 'OPEN' AND "cash_sessions"."closed_at" IS NULL AND "cash_sessions"."expected_amount" IS NULL AND "cash_sessions"."actual_amount" IS NULL AND "cash_sessions"."difference" IS NULL) OR ("cash_sessions"."status" = 'CLOSED' AND "cash_sessions"."closed_at" IS NOT NULL AND "cash_sessions"."expected_amount" IS NOT NULL AND "cash_sessions"."actual_amount" >= 0 AND "cash_sessions"."difference" = "cash_sessions"."actual_amount" - "cash_sessions"."expected_amount"))
);
--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "cash_session_id" uuid;--> statement-breakpoint
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_cash_session_id_cash_sessions_id_fk" FOREIGN KEY ("cash_session_id") REFERENCES "public"."cash_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cash_movements_session_idx" ON "cash_movements" USING btree ("cash_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cash_sessions_one_open" ON "cash_sessions" USING btree ("status") WHERE "cash_sessions"."status" = 'OPEN';--> statement-breakpoint
CREATE INDEX "cash_sessions_opened_at_idx" ON "cash_sessions" USING btree ("opened_at");--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_cash_session_id_cash_sessions_id_fk" FOREIGN KEY ("cash_session_id") REFERENCES "public"."cash_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sales_cash_session_idx" ON "sales" USING btree ("cash_session_id");