import path from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations.");
}

const databaseSsl = ["true", "1", "yes"].includes(
  (process.env.DATABASE_SSL ?? "").trim().toLowerCase(),
);

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(scriptDirectory, "../../drizzle");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseSsl ? { rejectUnauthorized: false } : undefined,
});

try {
  const db = drizzle(pool);

  await migrate(db, { migrationsFolder });
} finally {
  await pool.end();
}
