// Applies the pending migrations in drizzle/ with drizzle-orm's migrator, which keeps the same
// journal table as drizzle-kit (drizzle.__drizzle_migrations): databases migrated either way agree.
// The production container runs it before the server starts (Dockerfile); it needs no dev tools.
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("Defina DATABASE_URL.");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: url, max: 1 });
try {
  await migrate(drizzle({ client: pool }), {
    migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
  });
  console.log("Migrações em dia.");
} finally {
  await pool.end();
}
