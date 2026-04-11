import { sql } from "drizzle-orm";
import { boolean, index, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { wishlists } from "@/modules/wishlist/db/schema";

export const shareLinks = pgTable(
  "share_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wishlistId: uuid("wishlist_id")
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tokenUniqueIndex: uniqueIndex("share_links_token_unique").on(table.token),
    wishlistIdIndex: index("share_links_wishlist_id_idx").on(table.wishlistId),
    activeWishlistUniqueIndex: uniqueIndex("share_links_wishlist_id_active_unique")
      .on(table.wishlistId)
      .where(sql`${table.isActive}`),
  }),
);
