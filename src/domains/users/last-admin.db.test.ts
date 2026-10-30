import { inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import * as schema from "@/infrastructure/db/schema";
import { users } from "@/infrastructure/db/schema";
import { withTestPool } from "@/infrastructure/db/test-db";
import { updateUser } from "./service";

vi.mock("server-only", () => ({}));

let current: NodePgDatabase<typeof schema>;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));
// Widens the window between the check and the update, so a missing lock would show.
vi.mock("./repository", async (importOriginal) => {
  const repository = await importOriginal<typeof import("./repository")>();
  return {
    ...repository,
    updateUserChecked: ((id, patch, check) =>
      repository.updateUserChecked(id, patch, async (context) => {
        await check(context);
        await new Promise((resolve) => setTimeout(resolve, 250));
      })) satisfies typeof repository.updateUserChecked,
  };
});
// The log is not under test and would leave committed rows behind.
vi.mock("@/domains/activity/service", () => ({ logActivity: vi.fn() }));

// Needs real concurrent transactions, so it commits and cleans up after itself.
it("never leaves zero active ADMIN when two admins demote each other at once", async () => {
  await withTestPool(async (db) => {
    current = db;
    const rows = await db
      .insert(users)
      .values([
        {
          name: "Ana",
          email: "race-a@loja.com",
          role: "ADMIN",
          passwordHash: "x",
        },
        {
          name: "Bia",
          email: "race-b@loja.com",
          role: "ADMIN",
          passwordHash: "x",
        },
      ])
      .returning();
    const [a, b] = rows as [(typeof rows)[0], (typeof rows)[0]];
    try {
      const results = await Promise.allSettled([
        updateUser(a, b.id, { role: "CASHIER" }),
        updateUser(b, a.id, { role: "CASHIER" }),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      const refused = results.find((r) => r.status === "rejected");
      expect(refused?.reason).toBeInstanceOf(ServiceError);
      expect((refused?.reason as ServiceError).status).toBe(409);

      const after = await db
        .select({ role: users.role })
        .from(users)
        .where(inArray(users.id, [a.id, b.id]));
      expect(after.filter((u) => u.role === "ADMIN")).toHaveLength(1);
    } finally {
      await db.delete(users).where(inArray(users.id, [a.id, b.id]));
    }
  });
});
