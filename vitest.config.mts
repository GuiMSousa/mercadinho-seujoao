import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@ds": fileURLToPath(new URL("./design-system", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "design-system/**/*.test.{ts,tsx}"],
    // Real-database tests run with `npm run test:db`.
    exclude: ["**/node_modules/**", "**/*.db.test.ts"],
    restoreMocks: true,
  },
});
