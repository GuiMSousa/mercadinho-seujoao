import { expect, it, vi } from "vitest";
import { activityLog } from "@/infrastructure/db/schema";
import { withTestDb, type TestDb } from "@/infrastructure/db/test-db";
import { InvalidCursorError, listActivity, logActivity } from "./service";

vi.mock("server-only", () => ({}));

// The repository reaches the database through getDb(); point it at the test transaction.
let current: TestDb;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

const inTest = (fn: (db: TestDb) => Promise<void>) =>
  withTestDb(async (db) => {
    current = db;
    await fn(db);
  });

it("pages 120 entries as 50/50/20 without repeats, newest first", () =>
  inTest(async (db) => {
    const base = Date.UTC(2026, 0, 1);
    // Every third row shares a timestamp so the id tiebreak is exercised.
    await db.insert(activityLog).values(
      Array.from({ length: 120 }, (_, i) => ({
        userName: "Ana",
        action: "Login",
        detail: `n${i}`,
        createdAt: new Date(base + Math.floor(i / 3) * 1000),
      })),
    );

    const seen: string[] = [];
    const sizes: number[] = [];
    let cursor: string | undefined;
    do {
      const page = await listActivity({ cursor, limit: 50 });
      sizes.push(page.items.length);
      seen.push(...page.items.map((item) => item.id));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);

    expect(sizes).toEqual([50, 50, 20]);
    expect(new Set(seen).size).toBe(120);
  }));

it("orders by createdAt descending and exposes ISO timestamps", () =>
  inTest(async (db) => {
    await db.insert(activityLog).values([
      { userName: "A", action: "Login", createdAt: new Date("2026-01-01Z") },
      { userName: "B", action: "Logout", createdAt: new Date("2026-01-02Z") },
    ]);
    const { items, nextCursor } = await listActivity({ limit: 50 });
    expect(items.map((item) => item.userName)).toEqual(["B", "A"]);
    expect(items[0]).toMatchObject({
      at: "2026-01-02T00:00:00.000Z",
      detail: "",
    });
    expect(nextCursor).toBeNull();
  }));

it("rejects a malformed cursor", () =>
  inTest(async () => {
    await expect(
      listActivity({ cursor: "not-a-cursor", limit: 50 }),
    ).rejects.toBeInstanceOf(InvalidCursorError);
  }));

it("logActivity stores the entry, with or without a user", () =>
  inTest(async (db) => {
    await logActivity({ user: null, action: "Login", detail: "x" });
    const rows = await db.select().from(activityLog);
    expect(rows).toMatchObject([
      { userId: null, userName: "Sistema", action: "Login", detail: "x" },
    ]);
  }));
