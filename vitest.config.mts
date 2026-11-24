import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Windows: from a lowercase drive (Git Bash `/c/`, VS Code) Vitest loads itself twice and every
// file fails with "failed to find the current suite"; fail once with the fix instead.
if (/^[a-z]:/.test(process.cwd()))
  throw new Error(
    `Run Vitest from an uppercase drive path: cd "${process.cwd()[0].toUpperCase()}${process.cwd().slice(1)}" (Git Bash: cd /C/...).`,
  );

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
