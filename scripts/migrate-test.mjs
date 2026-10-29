// Applies the migrations to the test database (DATABASE_URL_TEST) instead of DATABASE_URL.
import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), true);
const url = process.env.DATABASE_URL_TEST;
if (!url) {
  console.error("Defina DATABASE_URL_TEST no .env.local.");
  process.exit(1);
}
// drizzle.config.ts prefers DATABASE_URL_UNPOOLED, so both are pointed at the test database.
const env = { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url };
const { status } = spawnSync("npx", ["drizzle-kit", "migrate"], {
  env,
  stdio: "inherit",
  shell: true,
});
process.exit(status ?? 1);
