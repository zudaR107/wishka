CREATE TABLE IF NOT EXISTS "wishlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wishlist_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"url" varchar(2048),
	"note" text,
	"price" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_wishlists_id_fk" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlist_items_wishlist_id_idx" ON "wishlist_items" USING btree ("wishlist_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlist_items_wishlist_id_created_at_idx" ON "wishlist_items" USING btree ("wishlist_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlists_user_id_idx" ON "wishlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlists_user_id_is_active_idx" ON "wishlists" USING btree ("user_id","is_active");