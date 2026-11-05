import "server-only";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { CashMovementInput } from "@/contracts/cash";
import { getDb, type Tx } from "@/infrastructure/db";
import { cashMovements, cashSessions, users } from "@/infrastructure/db/schema";
import { expectedCash } from "./expected";

const movementRow = {
  id: cashMovements.id,
  type: cashMovements.type,
  amount: cashMovements.amount,
  reason: cashMovements.reason,
  createdAt: cashMovements.createdAt,
};

// Money that went in or out of a session's drawer, correlated to the cash_sessions row being read.
// Written with explicit names: in a single-table select Drizzle drops the table from column names,
// and an unqualified "id" inside the subquery would be the sale's own id.
const cashSales =
  sql<number>`(SELECT coalesce(sum(s.total), 0) FROM sales s WHERE s.cash_session_id = cash_sessions.id AND s.payment_method = 'CASH')`.mapWith(
    Number,
  );
const movementTotal = (type: "BLEED" | "SUPPLY") =>
  sql<number>`(SELECT coalesce(sum(m.amount), 0) FROM cash_movements m WHERE m.cash_session_id = cash_sessions.id AND m.type = ${type})`.mapWith(
    Number,
  );
const totals = {
  initialAmount: cashSessions.initialAmount,
  cashSales,
  supplies: movementTotal("SUPPLY"),
  bleeds: movementTotal("BLEED"),
};

export async function selectOpenSession() {
  const [row] = await getDb()
    .select({
      id: cashSessions.id,
      openedAt: cashSessions.openedAt,
      openedBy: users.name,
      initialAmount: cashSessions.initialAmount,
    })
    .from(cashSessions)
    .innerJoin(users, eq(users.id, cashSessions.userId))
    .where(eq(cashSessions.status, "OPEN"));
  return row as typeof row | undefined;
}

/**
 * Inside `tx`, the open session locked FOR SHARE. Sales and movements can hold it together;
 * closing (FOR UPDATE) waits for them, and anything that waits on closing then finds it closed.
 */
export async function lockOpenSession(tx: Tx) {
  const [row] = await tx
    .select({ id: cashSessions.id })
    .from(cashSessions)
    .where(eq(cashSessions.status, "OPEN"))
    .for("share");
  return row as typeof row | undefined;
}

/** Opens the drawer; undefined when one is open already (the partial unique index refuses it). */
export async function insertSession(userId: string, initialAmount: number) {
  const [row] = await getDb()
    .insert(cashSessions)
    .values({ userId, initialAmount })
    .onConflictDoNothing()
    .returning({ id: cashSessions.id, openedAt: cashSessions.openedAt });
  return row as typeof row | undefined;
}

/**
 * Records a sangria or suprimento in the open session. A repeated id answers the movement already
 * recorded when it is the same one; otherwise "conflict". Without an open session, "closed".
 */
export function insertMovement(userId: string, input: CashMovementInput) {
  return getDb().transaction(async (tx) => {
    const open = await lockOpenSession(tx);
    if (open) {
      const [row] = await tx
        .insert(cashMovements)
        .values({ ...input, cashSessionId: open.id, userId })
        .onConflictDoNothing({ target: cashMovements.id })
        .returning(movementRow);
      if (row) return { row, created: true };
    }
    const [existing] = await tx
      .select({ ...movementRow, userId: cashMovements.userId })
      .from(cashMovements)
      .where(eq(cashMovements.id, input.id));
    if (!existing) return { refused: "closed" as const };
    const { userId: recordedBy, ...row } = existing;
    const same =
      recordedBy === userId &&
      row.type === input.type &&
      row.amount === input.amount &&
      row.reason === input.reason;
    return same ? { row, created: false } : { refused: "conflict" as const };
  });
}

/**
 * Closes the session with the counted amount. The FOR UPDATE lock waits for the sales and
 * movements in flight, and the totals are read in a later statement, which sees them all.
 */
export function closeSession(input: {
  sessionId: string;
  actualAmount: number;
  notes: string | null;
}) {
  return getDb().transaction(async (tx) => {
    const [session] = await tx
      .select({
        id: cashSessions.id,
        status: cashSessions.status,
        closedAt: cashSessions.closedAt,
        actualAmount: cashSessions.actualAmount,
      })
      .from(cashSessions)
      .where(eq(cashSessions.id, input.sessionId))
      .for("update");
    if (!session) return { kind: "missing" as const };
    if (session.status === "CLOSED")
      return { kind: "replay" as const, session };

    const [sums] = await tx
      .select(totals)
      .from(cashSessions)
      .where(eq(cashSessions.id, session.id));
    const expectedAmount = expectedCash(sums);
    const [closed] = await tx
      .update(cashSessions)
      .set({
        status: "CLOSED",
        closedAt: sql`now()`,
        expectedAmount,
        actualAmount: input.actualAmount,
        difference: input.actualAmount - expectedAmount,
        notes: input.notes,
        updatedAt: sql`now()`,
      })
      .where(eq(cashSessions.id, session.id))
      .returning({
        id: cashSessions.id,
        status: cashSessions.status,
        closedAt: cashSessions.closedAt,
        actualAmount: cashSessions.actualAmount,
        expectedAmount: cashSessions.expectedAmount,
        difference: cashSessions.difference,
      });
    if (!closed) throw new Error(`Locked cash session ${session.id} vanished`);
    return { kind: "closed" as const, session: closed };
  });
}

export const countSessions = () => getDb().$count(cashSessions);

/** Sessions, newest first, with what went in and out of each drawer. */
export function selectSessionsPage(page: { limit: number; offset: number }) {
  return getDb()
    .select({
      id: cashSessions.id,
      status: cashSessions.status,
      openedAt: cashSessions.openedAt,
      closedAt: cashSessions.closedAt,
      openedBy: users.name,
      expectedAmount: cashSessions.expectedAmount,
      actualAmount: cashSessions.actualAmount,
      difference: cashSessions.difference,
      notes: cashSessions.notes,
      ...totals,
    })
    .from(cashSessions)
    .innerJoin(users, eq(users.id, cashSessions.userId))
    .orderBy(desc(cashSessions.openedAt), desc(cashSessions.id))
    .limit(page.limit)
    .offset(page.offset);
}

export function selectMovements(sessionIds: string[]) {
  return getDb()
    .select({
      ...movementRow,
      cashSessionId: cashMovements.cashSessionId,
      userName: users.name,
    })
    .from(cashMovements)
    .innerJoin(users, eq(users.id, cashMovements.userId))
    .where(inArray(cashMovements.cashSessionId, sessionIds))
    .orderBy(asc(cashMovements.createdAt), asc(cashMovements.id));
}
