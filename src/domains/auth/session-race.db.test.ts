import { eq } from "drizzle-orm";
import { expect, it, vi } from "vitest";
import { sessions, users } from "@/infrastructure/db/schema";
import { withTestPool } from "@/infrastructure/db/test-db";
import { insertSessionIfCurrent } from "./sessions-repository";

vi.mock("server-only", () => ({}));

// Replaced by the pool in the test: two real connections are needed.
let current: unknown;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

it("waits for an uncommitted password change and then inserts nothing", () =>
  withTestPool(async (db) => {
    current = db;
    const email = `race-${Date.now()}@loja.com`;
    const [user] = await db
      .insert(users)
      .values({ name: "Race", email, role: "ADMIN", passwordHash: "old" })
      .returning();
    try {
      let release!: () => void;
      const held = new Promise<void>((resolve) => (release = resolve));
      let locked!: () => void;
      const updated = new Promise<void>((resolve) => (locked = resolve));
      // Connection A: the reset, held open until released.
      const reset = db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({ passwordHash: "new" })
          .where(eq(users.id, user.id));
        locked();
        await held;
      });
      await updated;

      let settled = false;
      const insert = insertSessionIfCurrent(
        {
          id: `race-${user.id}`,
          userId: user.id,
          csrfHash: "c",
          expiresAt: new Date(Date.now() + 60_000),
        },
        "old",
      ).then((ok) => ((settled = true), ok));
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(settled).toBe(false);

      release();
      await reset;
      await expect(insert).resolves.toBe(false);
      expect(
        await db.select().from(sessions).where(eq(sessions.userId, user.id)),
      ).toHaveLength(0);
    } finally {
      await db.delete(users).where(eq(users.id, user.id));
    }
  }));
