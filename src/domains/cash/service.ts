import "server-only";
import type { CashMovementInput, CloseCash } from "@/contracts/cash";
import { logActivity } from "@/domains/activity/service";
import { ServiceError } from "@/domains/auth/errors";
import { formatBrl } from "@ds/lib/money";
import { expectedCash } from "./expected";
import {
  closeSession,
  countSessions,
  insertMovement,
  insertSession,
  selectMovements,
  selectOpenSession,
  selectSessionsPage,
} from "./repository";

type Actor = { id: string; name: string };

const SESSIONS_PER_PAGE = 20;
const STALE_MESSAGE = "Este caixa já foi fechado. Atualize a tela.";
const CLOSED_MESSAGE = "Abra o caixa antes de registrar sangria ou suprimento.";
const MOVEMENT_ACTIONS = {
  BLEED: "Sangria registrada",
  SUPPLY: "Suprimento registrado",
} as const;

/** The open drawer as the counter sees it, or null when the cash is closed. */
export async function getOpenCashSession() {
  const row = await selectOpenSession();
  return row ? { ...row, openedAt: row.openedAt.toISOString() } : null;
}

export async function openCashSession(
  actor: Actor,
  { initialAmount }: { initialAmount: number },
) {
  const row = await insertSession(actor.id, initialAmount);
  if (!row)
    throw new ServiceError(
      409,
      "Já existe um caixa aberto. Atualize a tela para usá-lo.",
    );
  await logActivity({
    user: actor,
    action: "Caixa aberto",
    detail: `Troco inicial ${formatBrl(initialAmount)}`,
  });
  return {
    id: row.id,
    openedAt: row.openedAt.toISOString(),
    openedBy: actor.name,
    initialAmount,
  };
}

/** Sangria or suprimento, always with its reason, in the open drawer. */
export async function recordCashMovement(
  actor: Actor,
  input: CashMovementInput,
) {
  const result = await insertMovement(actor.id, input);
  if ("refused" in result) {
    if (result.refused === "closed")
      throw new ServiceError(422, CLOSED_MESSAGE, {
        fields: { cash: CLOSED_MESSAGE },
      });
    throw new ServiceError(
      409,
      "Este registro já foi feito com outros dados. Feche a janela e confira.",
    );
  }
  if (result.created)
    await logActivity({
      user: actor,
      action: MOVEMENT_ACTIONS[input.type],
      detail: `${formatBrl(input.amount)} · ${input.reason}`,
    });
  return { ...result.row, createdAt: result.row.createdAt.toISOString() };
}

/**
 * Blind closing: records the counted amount and works out the expected one and the difference,
 * but answers only what the operator typed. The reconciliation is in the ADMIN report.
 */
export async function closeCashSession(actor: Actor, input: CloseCash) {
  const result = await closeSession({
    sessionId: input.sessionId,
    actualAmount: input.actualAmount,
    notes: input.notes || null,
  });
  if (result.kind === "missing") throw new ServiceError(409, STALE_MESSAGE);
  const { session } = result;
  if (result.kind === "replay") {
    // A retry after a lost answer repeats the same count; any other count is a stale screen.
    if (session.actualAmount !== input.actualAmount)
      throw new ServiceError(409, STALE_MESSAGE);
  } else {
    const { expectedAmount, difference } = result.session;
    await logActivity({
      user: actor,
      action: "Caixa fechado",
      detail: `Contado ${formatBrl(input.actualAmount)} · esperado ${formatBrl(expectedAmount ?? 0)} · quebra ${formatBrl(difference ?? 0)}`,
    });
  }
  return {
    id: session.id,
    // Both branches read a closed row, which always has its closing time.
    closedAt: (session.closedAt as Date).toISOString(),
    actualAmount: input.actualAmount,
  };
}

/** Every session, newest first, with the reconciliation the counter never sees. */
export async function listCashSessions({ page }: { page: number }) {
  const total = await countSessions();
  const current = Math.min(
    page,
    Math.max(1, Math.ceil(total / SESSIONS_PER_PAGE)),
  );
  const rows = await selectSessionsPage({
    limit: SESSIONS_PER_PAGE,
    offset: (current - 1) * SESSIONS_PER_PAGE,
  });
  const movements = rows.length
    ? await selectMovements(rows.map((row) => row.id))
    : [];
  return {
    total,
    page: current,
    pageSize: SESSIONS_PER_PAGE,
    sessions: rows.map((row) => ({
      ...row,
      openedAt: row.openedAt.toISOString(),
      closedAt: row.closedAt?.toISOString() ?? null,
      // Stored at closing; while open, what the drawer should hold so far.
      expectedAmount: row.expectedAmount ?? expectedCash(row),
      movements: movements
        .filter((movement) => movement.cashSessionId === row.id)
        .map((movement) => ({
          ...movement,
          createdAt: movement.createdAt.toISOString(),
        })),
    })),
  };
}
