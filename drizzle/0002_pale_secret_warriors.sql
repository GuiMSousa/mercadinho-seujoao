-- Make existing rows satisfy the new constraints first. A session without a CSRF hash could never
-- pass the CSRF check, so deleting it only signs that user out. Emails are lowercased (the app
-- already stores them that way); a case-only duplicate would fail the unique index loudly here.
DELETE FROM "sessions" WHERE "csrf_hash" IS NULL;--> statement-breakpoint
UPDATE "users" SET "email" = lower("email") WHERE "email" <> lower("email");--> statement-breakpoint
UPDATE "stores" SET "singleton" = true WHERE NOT "singleton";--> statement-breakpoint
DROP INDEX "verification_codes_email_purpose_idx";--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "csrf_hash" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "verification_codes_email_purpose_created_idx" ON "verification_codes" USING btree ("email","purpose","created_at");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase" CHECK ("users"."email" = lower("users"."email"));--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_singleton_true" CHECK ("stores"."singleton");