import { boolean, index, numeric, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "@/modules/auth/db/schema";

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIndex: index("wishlists_user_id_idx").on(table.userId),
    userActiveIndex: index("wishlists_user_id_is_active_idx").on(table.userId, table.isActive),
  }),
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wishlistId: uuid("wishlist_id")
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    url: varchar("url", { length: 2048 }),
    note: text("note"),
    price: numeric("price", { precision: 12, scale: 0 }),
    starred: boolean("starred").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    wishlistIdIndex: index("wishlist_items_wishlist_id_idx").on(table.wishlistId),
    wishlistCreatedAtIndex: index("wishlist_items_wishlist_id_created_at_idx").on(
      table.wishlistId,
      table.createdAt,
    ),
  }),
);
