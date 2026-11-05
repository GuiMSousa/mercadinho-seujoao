"use client";

import type { ReactNode } from "react";
import type { CashSessionReport } from "@/contracts/cash";
import { Dialog } from "@ds/components/dialog";
import { Money } from "@ds/components/money";
import { formatBrl } from "@ds/lib/money";
import { formatDateTime } from "../_lib/format";
import { DifferenceBadge } from "./difference-badge";

const MOVEMENT_LABEL = { BLEED: "Sangria", SUPPLY: "Suprimento" } as const;

function Row({
  label,
  children,
  strong = false,
}: {
  label: string;
  children: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className={strong ? "font-medium text-strong" : "text-sub"}>
        {label}
      </dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  );
}

/** The reconciliation of one session: how the expected amount is made up, the count and the difference. */
export function CashSessionDialog({
  session,
  onClose,
}: {
  session: CashSessionReport;
  onClose: () => void;
}) {
  const open = session.status === "OPEN";
  return (
    <Dialog
      open
      onOpenChange={(next) => !next && onClose()}
      className="md:max-w-160"
      title={`Caixa de ${formatDateTime(session.openedAt)}`}
      description={
        open
          ? `Aberto por ${session.openedBy}; ainda não foi fechado.`
          : `Aberto por ${session.openedBy}, fechado em ${formatDateTime(session.closedAt ?? session.openedAt)}.`
      }
    >
      <div className="flex flex-col gap-5 text-body-lg">
        <dl className="divide-y divide-border-soft">
          <Row label="Troco inicial">{formatBrl(session.initialAmount)}</Row>
          <Row label="+ Vendas em dinheiro">{formatBrl(session.cashSales)}</Row>
          <Row label="+ Suprimentos">{formatBrl(session.supplies)}</Row>
          <Row label="− Sangrias">{formatBrl(session.bleeds)}</Row>
          <Row label={open ? "= Esperado até agora" : "= Esperado"} strong>
            <span className="font-medium text-strong">
              {formatBrl(session.expectedAmount)}
            </span>
          </Row>
          <Row label="Contado na gaveta">
            {session.actualAmount === null
              ? "—"
              : formatBrl(session.actualAmount)}
          </Row>
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-sunken px-4 py-3">
          <span className="flex flex-col gap-1">
            <span className="font-medium text-strong">Quebra de caixa</span>
            <DifferenceBadge difference={session.difference} />
          </span>
          {session.difference !== null && (
            <Money
              cents={session.difference}
              size="xl"
              signed
              tone={session.difference < 0 ? "out" : "in"}
            />
          )}
        </div>
        {session.notes && (
          <p className="text-sub">
            <span className="font-medium text-strong">Observações: </span>
            {session.notes}
          </p>
        )}
        <section
          aria-labelledby="movements-title"
          className="flex flex-col gap-2"
        >
          <h3 id="movements-title" className="font-medium text-strong">
            Sangrias e suprimentos
          </h3>
          {session.movements.length === 0 ? (
            <p className="text-sub">Nenhuma movimentação neste caixa.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-soft">
              {session.movements.map((movement) => (
                <li
                  key={movement.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2"
                >
                  <span className="flex flex-col">
                    <span className="text-strong">
                      {MOVEMENT_LABEL[movement.type]} · {movement.reason}
                    </span>
                    <span className="text-body-md text-sub">
                      {formatDateTime(movement.createdAt)} · {movement.userName}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {movement.type === "BLEED" ? "−" : "+"}
                    {formatBrl(movement.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Dialog>
  );
}
