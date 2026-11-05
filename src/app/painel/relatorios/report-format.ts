import { marginLevel } from "@/contracts/reports";

const percent = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** "42,2%", or "—" when there is nothing to divide. */
export const formatPercent = (value: number | null) =>
  value === null ? "—" : `${percent.format(value)}%`;

/** Tone and word of a margin: the color never carries the meaning alone. */
export function marginBadge(value: number | null) {
  const level = marginLevel(value);
  if (level === null) return { tone: "neutral" as const, label: "Sem vendas" };
  return {
    good: { tone: "success" as const, label: "Boa" },
    fair: { tone: "warning" as const, label: "Atenção" },
    low: { tone: "danger" as const, label: "Baixa" },
  }[level];
}

/** "05/11/2026" from "2026-11-05". */
export const formatDay = (date: string) => date.split("-").reverse().join("/");
