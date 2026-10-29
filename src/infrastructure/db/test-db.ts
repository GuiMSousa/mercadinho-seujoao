import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { databaseUrlSchema, parseEnv } from "@/lib/env-schema";
import * as schema from "./schema";

export type TestDb = Parameters<
  Parameters<NodePgDatabase<typeof schema>["transaction"]>[0]
>[0];

class Rollback extends Error {}

/**
 * Runs `fn` against DATABASE_URL_TEST inside a transaction that is always rolled back,
 * so each test sees the migrated schema and leaves no rows behind. Inside `fn`,
 * `db.transaction(...)` is a savepoint: use it to assert on statements that must fail.
 */
export async function withTestDb(fn: (db: TestDb) => Promise<void>) {
  const url = parseEnv(
    "DATABASE_URL_TEST",
    process.env.DATABASE_URL_TEST,
    databaseUrlSchema,
  );
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await drizzle({ client: pool, schema }).transaction(async (tx) => {
      await fn(tx);
      throw new Rollback();
    });
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  } finally {
    await pool.end();
  }
}
