import { sql } from "drizzle-orm";
import { index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "@/modules/auth/db/schema";
import { wishlistItems } from "@/modules/wishlist/db/schema";

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wishlistItemId: uuid("wishlist_item_id")
      .notNull()
      .references(() => wishlistItems.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    wishlistItemIdIndex: index("reservations_wishlist_item_id_idx").on(
      table.wishlistItemId,
    ),
    userIdIndex: index("reservations_user_id_idx").on(table.userId),
    activeWishlistItemUniqueIndex: uniqueIndex(
      "reservations_wishlist_item_id_active_unique",
    )
      .on(table.wishlistItemId)
      .where(sql`${table.cancelledAt} IS NULL`),
  }),
);
