ALTER TABLE "users" ADD COLUMN "preferred_currency" varchar(3) DEFAULT 'RUB' NOT NULL;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD COLUMN "currency" varchar(3) DEFAULT 'RUB' NOT NULL;