import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// DATABASE_URL_TEST comes from .env.local (CI sets it in the environment). Next's loader skips
// .env.local when NODE_ENV=test, so read it directly; existing variables are not overridden.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (CI): the variables must already be in the environment.
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@ds": fileURLToPath(new URL("./design-system", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.db.test.ts"],
    restoreMocks: true,
    // One shared test database: files run one at a time.
    fileParallelism: false,
  },
});
