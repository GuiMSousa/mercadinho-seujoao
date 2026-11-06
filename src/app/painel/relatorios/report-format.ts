import { marginLevel } from "@/contracts/reports";

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
