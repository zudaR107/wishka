import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as authSchema from "@/modules/auth/db/schema";
import * as shareSchema from "@/modules/share/db/schema";
import * as wishlistSchema from "@/modules/wishlist/db/schema";
import { getDatabaseEnv } from "@/shared/db/env";

const { databaseUrl, databaseSsl } = getDatabaseEnv();

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseSsl ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, {
  schema: {
    ...authSchema,
    ...shareSchema,
    ...wishlistSchema,
  },
});
