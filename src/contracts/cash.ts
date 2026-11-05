import { z } from "zod";
import { CASH_MOVEMENT_TYPES, CASH_SESSION_STATUSES } from "./enums";
import { hasNoNul, MAX_INTEGER, NUL_MESSAGE } from "./inventory";

const cents = (message: string, min = 0) =>
  z.int(message).min(min, message).max(MAX_INTEGER, "Valor acima do limite.");

export const CASH_CLOSED_MESSAGE =
  "Não é possível realizar vendas com o caixa fechado.";

export const cashMovementTypeSchema = z.enum(
  CASH_MOVEMENT_TYPES,
  "Escolha sangria ou suprimento.",
);

export const openCashSchema = z.object({
  initialAmount: cents("Informe o troco inicial em centavos."),
});

export const cashMovementSchema = z.object({
  // Chosen by the client: repeating it after a lost response does not record the money twice.
  id: z.uuid("Identificador inválido."),
  type: cashMovementTypeSchema,
  amount: cents("Informe um valor maior que zero, em centavos.", 1),
  reason: z
    .string("Informe o motivo.")
    .trim()
    .min(1, "Informe o motivo.")
    .max(200, "Use até 200 caracteres.")
    .refine(hasNoNul, NUL_MESSAGE),
});

export const closeCashSchema = z.object({
  // The session the operator is closing: a stale screen cannot close one opened since.
  sessionId: z.uuid("Caixa inválido."),
  actualAmount: cents("Informe o dinheiro contado em centavos."),
  notes: z
    .string()
    .trim()
    .max(500, "Use até 500 caracteres.")
    .refine(hasNoNul, NUL_MESSAGE)
    .optional(),
});

// What the counter sees. Blind closing (PRODUCT.md): never the expected amount or the difference.
export const openCashSessionSchema = z.object({
  id: z.uuid(),
  openedAt: z.iso.datetime(),
  openedBy: z.string(),
  initialAmount: z.int(),
});
export const cashMovementRowSchema = z.object({
  id: z.uuid(),
  type: cashMovementTypeSchema,
  amount: z.int(),
  reason: z.string(),
  createdAt: z.iso.datetime(),
});
export const closedCashSchema = z.object({
  id: z.uuid(),
  closedAt: z.iso.datetime(),
  actualAmount: z.int(),
});

// ADMIN only: the reconciliation of each session.
export const cashSessionReportSchema = z.object({
  id: z.uuid(),
  status: z.enum(CASH_SESSION_STATUSES),
  openedAt: z.iso.datetime(),
  closedAt: z.iso.datetime().nullable(),
  openedBy: z.string(),
  initialAmount: z.int(),
  cashSales: z.int(),
  supplies: z.int(),
  bleeds: z.int(),
  // While open, what the drawer should hold so far; once closed, what was recorded at closing.
  expectedAmount: z.int(),
  actualAmount: z.int().nullable(),
  difference: z.int().nullable(),
  notes: z.string().nullable(),
  movements: z.array(cashMovementRowSchema.extend({ userName: z.string() })),
});
export const cashSessionsPageSchema = z.object({
  sessions: z.array(cashSessionReportSchema),
  total: z.int(),
  page: z.int(),
  pageSize: z.int(),
});
export const cashPageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export type OpenCashSession = z.infer<typeof openCashSessionSchema>;
export type CashMovementInput = z.output<typeof cashMovementSchema>;
export type CloseCash = z.output<typeof closeCashSchema>;
export type CashSessionReport = z.infer<typeof cashSessionReportSchema>;
export type CashSessionsPage = z.infer<typeof cashSessionsPageSchema>;
