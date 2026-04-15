ALTER TABLE "wishlist_items" ALTER COLUMN "price" TYPE numeric(12, 0) USING ROUND("price");
