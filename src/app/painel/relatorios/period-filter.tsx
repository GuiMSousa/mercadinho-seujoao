"use client";

import { useState, type FormEvent } from "react";
import {
  MAX_REPORT_DAYS,
  REPORT_PERIODS,
  type ReportPeriod,
} from "@/contracts/reports";
import { Button } from "@ds/components/button";
import { Input } from "@ds/components/input";
import { Tabs } from "@ds/components/tabs";

export type PeriodQuery = {
  period: (typeof REPORT_PERIODS)[number];
  from?: string;
  to?: string;
};

const LABELS: Record<PeriodQuery["period"], string> = {
  today: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  month: "Mês atual",
  custom: "Período livre",
};
const DAY_MS = 86_400_000;

/** Quick periods, plus a free one with its first and last day (inclusive). */
export function PeriodFilter({
  value,
  resolved,
  onChange,
}: {
  value: PeriodQuery;
  /** The days the current report covers; they start the free period. */
  resolved: ReportPeriod;
  onChange: (query: PeriodQuery) => void;
}) {
  const [custom, setCustom] = useState(value.period === "custom");
  const [from, setFrom] = useState(resolved.from);
  const [to, setTo] = useState(resolved.to);
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});

  function apply(event: FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!from) next.from = "Informe a data inicial.";
    if (!to) next.to = "Informe a data final.";
    else if (from && from > to) next.to = "A data final vem depois da inicial.";
    else if (
      from &&
      (Date.parse(to) - Date.parse(from)) / DAY_MS >= MAX_REPORT_DAYS
    )
      next.to = `Escolha um período de até ${MAX_REPORT_DAYS} dias.`;
    setErrors(next);
    if (Object.keys(next).length === 0)
      onChange({ period: "custom", from, to });
  }

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        aria-label="Período do relatório"
        className="flex-wrap"
        items={REPORT_PERIODS.map((period) => ({
          value: period,
          label: LABELS[period],
        }))}
        value={custom ? "custom" : value.period}
        onValueChange={(next) => {
          if (next === "custom") return setCustom(true);
          setCustom(false);
          onChange({ period: next as PeriodQuery["period"] });
        }}
      />
      {custom && (
        <form
          noValidate
          onSubmit={apply}
          className="flex flex-wrap items-end gap-3"
        >
          <Input
            type="date"
            label="De"
            name="from"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            error={errors.from}
          />
          <Input
            type="date"
            label="Até"
            name="to"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            error={errors.to}
          />
          <Button type="submit">Aplicar período</Button>
        </form>
      )}
    </div>
  );
}
