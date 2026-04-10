# DB Foundation

## Purpose
- `src/shared/db/client.ts`: PostgreSQL connection and Drizzle database entry point
- `src/shared/db/env.ts`: database-related environment parsing
- `drizzle.config.ts`: Drizzle CLI configuration
- `drizzle/`: generated SQL migrations and Drizzle metadata

## Schema Layout
- Module-owned schema files should live at `src/modules/<module>/db/schema.ts`
- The first schema files are expected in `src/modules/auth/db/schema.ts`
  and `src/modules/wishlist/db/schema.ts`

## Environment Contract
- `DATABASE_URL`: required PostgreSQL connection string
- `DATABASE_SSL`: optional boolean flag for SSL mode; default is `false`
