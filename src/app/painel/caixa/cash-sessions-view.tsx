"use client";

import { useState } from "react";
import type { CashSessionReport, CashSessionsPage } from "@/contracts/cash";
import { Button } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Money } from "@ds/components/money";
import { Table, type TableColumn } from "@ds/components/table";
import { formatBrl } from "@ds/lib/money";
import { formatDateTime } from "../_lib/format";
import { Pagination } from "../_lib/pagination";
import { usePagedList } from "../_lib/use-paged-list";
import { CashSessionDialog } from "./cash-session-dialog";
import { DifferenceBadge } from "./difference-badge";

/** The latest closing up front: the difference is what the owner looks for first. */
function Highlights({ sessions }: { sessions: CashSessionReport[] }) {
  const current = sessions.find((session) => session.status === "OPEN");
  const lastClosed = sessions.find((session) => session.status === "CLOSED");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Caixa atual">
        {current ? (
          <div className="flex flex-col gap-1">
            <Money cents={current.expectedAmount} size="xl" />
            <p className="text-body-md text-sub">
              Esperado na gaveta até agora · aberto em{" "}
              {formatDateTime(current.openedAt)} por {current.openedBy}
            </p>
          </div>
        ) : (
          <p className="text-sub">Nenhum caixa aberto.</p>
        )}
      </Card>
      <Card title="Último fechamento">
        {lastClosed && lastClosed.difference !== null ? (
          <div className="flex flex-col gap-2">
            <Money
              cents={lastClosed.difference}
              size="xl"
              signed
              tone={lastClosed.difference < 0 ? "out" : "in"}
            />
            <DifferenceBadge difference={lastClosed.difference} />
            <p className="text-body-md text-sub">
              Contado {formatBrl(lastClosed.actualAmount ?? 0)} contra{" "}
              {formatBrl(lastClosed.expectedAmount)} esperados ·{" "}
              {formatDateTime(lastClosed.closedAt ?? lastClosed.openedAt)}
            </p>
          </div>
        ) : (
          <p className="text-sub">Nenhum caixa fechado ainda.</p>
        )}
      </Card>
    </div>
  );
}

export function CashSessionsView({ initial }: { initial: CashSessionsPage }) {
  const { data, loading, goTo } = usePagedList(
    "/api/admin/cash-sessions",
    initial,
  );
  const [detail, setDetail] = useState<CashSessionReport | null>(null);

  const columns: TableColumn<CashSessionReport>[] = [
    {
      key: "opened",
      label: "Abertura",
      render: (session) => (
        <span className="flex flex-col">
          <span className="font-medium">
            {formatDateTime(session.openedAt)}
          </span>
          <span className="text-sub">{session.openedBy}</span>
        </span>
      ),
    },
    {
      key: "closed",
      label: "Fechamento",
      className: "hidden md:table-cell",
      render: (session) =>
        session.closedAt ? formatDateTime(session.closedAt) : "—",
    },
    {
      key: "expected",
      label: "Esperado",
      align: "right",
      render: (session) => formatBrl(session.expectedAmount),
    },
    {
      key: "actual",
      label: "Contado",
      align: "right",
      className: "hidden sm:table-cell",
      render: (session) =>
        session.actualAmount === null ? "—" : formatBrl(session.actualAmount),
    },
    {
      key: "difference",
      label: "Quebra",
      render: (session) => <DifferenceBadge difference={session.difference} />,
    },
    {
      key: "detail",
      label: <span className="sr-only">Detalhes</span>,
      align: "right",
      render: (session) => (
        <Button
          variant="secondary"
          size="sm"
          aria-label={`Ver o caixa de ${formatDateTime(session.openedAt)}`}
          onClick={() => setDetail(session)}
        >
          Detalhes
        </Button>
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
      <Highlights sessions={initial.sessions} />
      <Card title="Histórico de caixas" flush>
        <div aria-busy={loading}>
          <Table
            caption="Histórico de caixas"
            columns={columns}
            rows={data.sessions}
            rowKey={(session) => session.id}
            empty="Nenhum caixa aberto ainda. O operador abre o caixa na frente de caixa."
          />
        </div>
      </Card>
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        noun={{ one: "caixa", many: "caixas" }}
        loading={loading}
        onPage={(page) => void goTo(page)}
      />
      {detail && (
        <CashSessionDialog session={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
