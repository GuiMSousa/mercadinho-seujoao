"use client";

import { useState, type FormEvent } from "react";
import {
  REPORT_PERIODS,
  reportQuerySchema,
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
    // The API's own rule, so the screen never accepts a period the server refuses.
    const parsed = reportQuerySchema.safeParse({
      period: "custom",
      from: from || undefined,
      to: to || undefined,
    });
    const next: typeof errors = {};
    for (const issue of parsed.error?.issues ?? [])
      next[issue.path[0] === "to" ? "to" : "from"] ??= issue.message;
    setErrors(next);
    if (parsed.success) onChange({ period: "custom", from, to });
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
