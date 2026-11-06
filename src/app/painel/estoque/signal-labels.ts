import type { Signal } from "@/domains/inventory/semaphore";

export const SIGNAL_TONE = {
  green: "success",
  yellow: "warning",
  red: "danger",
} as const satisfies Record<Signal, string>;

/** The word carries the state too, so the semaphore never depends on color alone. */
export const SIGNAL_LABEL = {
  green: "Tudo certo",
  yellow: "Atenção",
  red: "Urgente",
} as const satisfies Record<Signal, string>;

export function expiryLabel(daysLeft: number | null) {
  if (daysLeft === null) return "Não vence";
  if (daysLeft < 0) return "Vencido";
  if (daysLeft === 0) return "Vence hoje";
  if (daysLeft === 1) return "Vence amanhã";
  return `Vence em ${daysLeft} dias`;
}
