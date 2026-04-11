CREATE TABLE IF NOT EXISTS "share_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wishlist_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "share_links" ADD CONSTRAINT "share_links_wishlist_id_wishlists_id_fk" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "share_links_token_unique" ON "share_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "share_links_wishlist_id_idx" ON "share_links" USING btree ("wishlist_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "share_links_wishlist_id_active_unique" ON "share_links" USING btree ("wishlist_id") WHERE "share_links"."is_active";