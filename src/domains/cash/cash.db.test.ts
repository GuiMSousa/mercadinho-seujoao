import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { expect, it, vi } from "vitest";
import { logActivity } from "@/domains/activity/service";
import { registerSale } from "@/domains/sales/service";
import * as schema from "@/infrastructure/db/schema";
import {
  cashMovements,
  cashSessions,
  categories,
  inventoryBatches,
  inventoryMovements,
  products,
  salePayments,
  sales,
  users,
} from "@/infrastructure/db/schema";
import {
  withTestDb,
  withTestPool,
  type TestDb,
} from "@/infrastructure/db/test-db";
import {
  closeCashSession,
  listCashSessions,
  openCashSession,
  recordCashMovement,
} from "./service";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/activity/service", () => ({ logActivity: vi.fn() }));

// The repositories reach the database through getDb(); point it at the test database.
let current: TestDb | NodePgDatabase<typeof schema>;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

const inTest = (fn: (db: TestDb) => Promise<void>) =>
  withTestDb(async (db) => {
    current = db;
    await fn(db);
  });

type Db = Pick<TestDb, "insert">;

async function newUser(db: Db) {
  const [user] = await db
    .insert(users)
    .values({
      name: "Carla",
      email: `${randomUUID()}@example.com`,
      role: "CASHIER",
    })
    .returning();
  return user;
}

/** A sale row with its payments straight into the drawer; items do not matter to the cash register. */
async function saleInto(
  db: Db,
  cashSessionId: string,
  userId: string,
  payments: [method: "CASH" | "PIX" | "ON_ACCOUNT", amount: number][],
) {
  const total = payments.reduce((sum, [, amount]) => sum + amount, 0);
  const [sale] = await db
    .insert(sales)
    .values({ userId, cashSessionId, total, amountReceived: total, change: 0 })
    .returning({ id: sales.id });
  await db
    .insert(salePayments)
    .values(
      payments.map(([method, amount]) => ({ saleId: sale.id, method, amount })),
    );
}

const movement = (
  type: "BLEED" | "SUPPLY",
  amount: number,
  reason: string,
) => ({ id: randomUUID(), type, amount, reason });

it("opens one drawer at a time", async () => {
  await inTest(async (db) => {
    const user = await newUser(db);
    const opened = await openCashSession(user, { initialAmount: 10000 });
    expect(opened).toMatchObject({
      openedBy: "Carla",
      initialAmount: 10000,
    });
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "Caixa aberto",
        detail: "Troco inicial R$\u00a0100,00",
      }),
    );
    await expect(
      openCashSession(user, { initialAmount: 5000 }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

it("records sangrias and suprimentos with their reason, once per id, only with the cash open", async () => {
  await inTest(async (db) => {
    const user = await newUser(db);
    const { id: sessionId } = await openCashSession(user, {
      initialAmount: 10000,
    });
    const bleed = movement("BLEED", 2000, "Depósito no banco");

    const recorded = await recordCashMovement(user, bleed);
    expect(recorded).toMatchObject({
      id: bleed.id,
      type: "BLEED",
      amount: 2000,
      reason: "Depósito no banco",
    });
    // A retry after a lost answer records nothing new and answers the same movement.
    await expect(recordCashMovement(user, bleed)).resolves.toEqual(recorded);
    await expect(
      recordCashMovement(user, { ...bleed, amount: 2500 }),
    ).rejects.toMatchObject({ status: 409 });
    await recordCashMovement(user, movement("SUPPLY", 500, "Moedas"));
    const rows = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.cashSessionId, sessionId));
    expect(rows.map((row) => [row.type, row.amount])).toEqual([
      ["BLEED", 2000],
      ["SUPPLY", 500],
    ]);
    expect(
      vi.mocked(logActivity).mock.calls.map(([call]) => call.action),
    ).toEqual(["Caixa aberto", "Sangria registrada", "Suprimento registrado"]);

    await closeCashSession(user, { sessionId, actualAmount: 8500 });
    await expect(
      recordCashMovement(user, movement("BLEED", 100, "Troco")),
    ).rejects.toMatchObject({
      status: 422,
      options: { fields: { cash: expect.any(String) } },
    });
  });
});

it("closes blind: records the expected amount and the difference, answers only the count", async () => {
  await inTest(async (db) => {
    const user = await newUser(db);
    const { id: sessionId } = await openCashSession(user, {
      initialAmount: 10000,
    });
    await saleInto(db, sessionId, user.id, [["CASH", 4572]]);
    // Pix and fiado never reach the drawer; a split sale counts only its cash share.
    await saleInto(db, sessionId, user.id, [["PIX", 3000]]);
    await saleInto(db, sessionId, user.id, [
      ["CASH", 1000],
      ["PIX", 500],
      ["ON_ACCOUNT", 300],
    ]);
    await recordCashMovement(user, movement("SUPPLY", 500, "Moedas"));
    await recordCashMovement(user, movement("BLEED", 2000, "Depósito"));

    // Expected: 100,00 + 45,72 + 10,00 + 5,00 − 20,00 = 140,72; counted 140,00 → 0,72 short.
    const closed = await closeCashSession(user, {
      sessionId,
      actualAmount: 14000,
      notes: "Faltou troco",
    });

    expect(closed).toEqual({
      id: sessionId,
      closedAt: expect.any(String),
      actualAmount: 14000,
    });
    const [row] = await db
      .select()
      .from(cashSessions)
      .where(eq(cashSessions.id, sessionId));
    expect(row).toMatchObject({
      status: "CLOSED",
      expectedAmount: 14072,
      actualAmount: 14000,
      difference: -72,
      notes: "Faltou troco",
    });
    expect(logActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: "Caixa fechado",
        detail:
          "Contado R$\u00a0140,00 · esperado R$\u00a0140,72 · quebra −R$\u00a00,72",
      }),
    );
    // The same count again is a retry; another count, or another session, is a stale screen.
    await expect(
      closeCashSession(user, { sessionId, actualAmount: 14000 }),
    ).resolves.toEqual(closed);
    await expect(
      closeCashSession(user, { sessionId, actualAmount: 14100 }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      closeCashSession(user, { sessionId: randomUUID(), actualAmount: 0 }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

it("reports each session with its breakdown, the open one with what it should hold so far", async () => {
  await inTest(async (db) => {
    const user = await newUser(db);
    const first = await openCashSession(user, { initialAmount: 10000 });
    await saleInto(db, first.id, user.id, [["CASH", 4572]]);
    await recordCashMovement(user, movement("BLEED", 2000, "Depósito"));
    await closeCashSession(user, { sessionId: first.id, actualAmount: 12600 });
    // now() is the transaction start, the same for both openings here: move the first back.
    await db
      .update(cashSessions)
      .set({ openedAt: sql`now() - interval '1 hour'` })
      .where(eq(cashSessions.id, first.id));
    const second = await openCashSession(user, { initialAmount: 5000 });
    await recordCashMovement(user, movement("SUPPLY", 1000, "Moedas"));

    const { sessions } = await listCashSessions({ page: 1 });
    const byId = (id: string) => sessions.find((session) => session.id === id);

    expect(sessions.findIndex((s) => s.id === second.id)).toBeLessThan(
      sessions.findIndex((s) => s.id === first.id),
    );
    expect(byId(first.id)).toMatchObject({
      status: "CLOSED",
      openedBy: "Carla",
      initialAmount: 10000,
      cashSales: 4572,
      supplies: 0,
      bleeds: 2000,
      expectedAmount: 12572,
      actualAmount: 12600,
      difference: 28,
      movements: [
        { type: "BLEED", amount: 2000, reason: "Depósito", userName: "Carla" },
      ],
    });
    expect(byId(second.id)).toMatchObject({
      status: "OPEN",
      closedAt: null,
      expectedAmount: 6000,
      actualAmount: null,
      difference: null,
    });
  });
});

async function removeAll(
  db: NodePgDatabase<typeof schema>,
  userId: string,
  extra: () => Promise<unknown> = async () => undefined,
) {
  await db
    .delete(salePayments)
    .where(
      inArray(
        salePayments.saleId,
        db.select({ id: sales.id }).from(sales).where(eq(sales.userId, userId)),
      ),
    );
  await db.delete(sales).where(eq(sales.userId, userId));
  await extra();
  await db.delete(cashMovements).where(eq(cashMovements.userId, userId));
  await db.delete(cashSessions).where(eq(cashSessions.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

/** Waits until `count` statements are blocked on a lock; read on another connection. */
const lockWaiters = (db: NodePgDatabase<typeof schema>, count: number) =>
  vi.waitFor(
    async () => {
      const { rows } = await db.execute<{ waiting: number }>(
        sql`SELECT count(*)::int AS waiting FROM pg_stat_activity
             WHERE datname = current_database() AND wait_event_type = 'Lock'`,
      );
      expect(rows[0].waiting).toBeGreaterThanOrEqual(count);
    },
    { timeout: 25_000, interval: 20 },
  );

it("refuses a sale that waited on a closing, once the closing commits", async () => {
  await withTestPool(async (db) => {
    current = db;
    const user = await newUser(db);
    const [category] = await db
      .insert(categories)
      .values({ name: `Categoria ${randomUUID()}` })
      .returning();
    const [coffee] = await db
      .insert(products)
      .values({
        barcode: randomUUID(),
        name: "Café",
        categoryId: category.id,
        costPrice: 1290,
        sellPrice: 1849,
        unit: "UN",
      })
      .returning();
    try {
      await db
        .insert(inventoryBatches)
        .values({ productId: coffee.id, batchCode: "A", quantity: 5 });
      const { id: sessionId } = await openCashSession(user, {
        initialAmount: 0,
      });

      // A closing in progress holds the drawer; the sale passes the early check and waits.
      let attempt: Promise<unknown> = Promise.resolve();
      await db.transaction(async (tx) => {
        await tx
          .select({ id: cashSessions.id })
          .from(cashSessions)
          .where(eq(cashSessions.id, sessionId))
          .for("update");
        attempt = registerSale(
          user,
          {
            id: randomUUID(),
            items: [{ productId: coffee.id, quantity: 1, discount: 0 }],
            discount: 0,
            total: 1849,
            payments: [{ method: "CASH", amount: 1849 }],
          },
          "2026-11-05",
        );
        await lockWaiters(db, 1);
        await tx
          .update(cashSessions)
          .set({
            status: "CLOSED",
            closedAt: new Date(),
            expectedAmount: 0,
            actualAmount: 0,
            difference: 0,
          })
          .where(eq(cashSessions.id, sessionId));
      });

      await expect(attempt).rejects.toMatchObject({ status: 422 });
      const [stock] = await db
        .select({ quantity: inventoryBatches.quantity })
        .from(inventoryBatches)
        .where(eq(inventoryBatches.productId, coffee.id));
      expect(stock.quantity).toBe(5);
    } finally {
      await removeAll(db, user.id, async () => {
        await db
          .delete(inventoryMovements)
          .where(eq(inventoryMovements.productId, coffee.id));
        await db
          .delete(inventoryBatches)
          .where(eq(inventoryBatches.productId, coffee.id));
        await db.delete(products).where(eq(products.id, coffee.id));
        await db.delete(categories).where(eq(categories.id, category.id));
      });
    }
  });
}, 30_000);

it("counts in the expected amount a sale that was in flight when the closing began", async () => {
  await withTestPool(async (db) => {
    current = db;
    const user = await newUser(db);
    try {
      const { id: sessionId } = await openCashSession(user, {
        initialAmount: 10000,
      });

      // A sale in flight holds the drawer FOR SHARE, as insertSale does; the closing waits for it.
      let closing: Promise<unknown> = Promise.resolve();
      await db.transaction(async (tx) => {
        await tx
          .select({ id: cashSessions.id })
          .from(cashSessions)
          .where(eq(cashSessions.status, "OPEN"))
          .for("share");
        closing = closeCashSession(user, { sessionId, actualAmount: 11849 });
        await lockWaiters(db, 1);
        await saleInto(tx, sessionId, user.id, [["CASH", 1849]]);
      });
      await closing;

      const [row] = await db
        .select()
        .from(cashSessions)
        .where(eq(cashSessions.id, sessionId));
      expect(row).toMatchObject({
        expectedAmount: 11849,
        difference: 0,
      });
    } finally {
      await removeAll(db, user.id);
    }
  });
}, 30_000);
