ALTER TABLE "cards" ADD COLUMN "currency" text DEFAULT 'UZS' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "currency";