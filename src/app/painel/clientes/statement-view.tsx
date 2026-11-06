"use client";

import { ArrowLeft, HandCoins } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type {
  CustomerPaymentResult,
  CustomerStatement,
  CustomerTransaction,
} from "@/contracts/customers";
import type { ReceiptStore } from "@/app/caixa/receipt-text";
import { Badge } from "@ds/components/badge";
import { Button, buttonVariants } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Money } from "@ds/components/money";
import { Table, type TableColumn } from "@ds/components/table";
import { cn } from "@ds/lib/cn";
import { formatDateTime } from "../_lib/format";
import { Pagination } from "../_lib/pagination";
import { usePagedList } from "../_lib/use-paged-list";
import { PaymentDialog } from "./payment-dialog";
import { paymentReceiptLines } from "./payment-receipt";

const columns: TableColumn<CustomerTransaction>[] = [
  {
    key: "when",
    label: "Data e hora",
    render: (row) => formatDateTime(row.createdAt),
  },
  {
    key: "type",
    label: "Movimento",
    render: (row) =>
      row.type === "DEBIT" ? (
        <span className="flex flex-col items-start gap-1">
          <Badge tone="warning">Compra no fiado</Badge>
          {row.saleNumber !== null && (
            <span className="text-body-sm text-sub">
              Venda nº {row.saleNumber}
            </span>
          )}
        </span>
      ) : (
        <Badge tone="success">Pagamento</Badge>
      ),
  },
  {
    key: "amount",
    label: "Valor",
    align: "right",
    // A purchase raises the debt, a payment lowers it.
    render: (row) => (
      <Money
        cents={row.type === "DEBIT" ? row.amount : -row.amount}
        size="sm"
        signed
        tone={row.type === "DEBIT" ? "out" : "margin"}
      />
    ),
  },
  {
    key: "user",
    label: "Registrado por",
    className: "hidden md:table-cell",
    render: (row) => row.userName,
  },
  {
    key: "notes",
    label: "Observação",
    wrap: true,
    className: "hidden lg:table-cell",
    render: (row) => row.notes || "—",
  },
];

/** The customer's debt and statement, newest first, with the payment (quitação). */
export function StatementView({
  initial,
  store,
}: {
  initial: CustomerStatement;
  store: ReceiptStore;
}) {
  const { data, loading, goTo, reload } = usePagedList(
    `/api/admin/customers/${initial.customer.id}`,
    initial,
  );
  const { customer } = data;
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState<CustomerPaymentResult | null>(null);

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
      <Link
        href="/painel/clientes"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "self-start",
        )}
      >
        <ArrowLeft aria-hidden="true" />
        Clientes
      </Link>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-h2 font-medium wrap-anywhere text-strong">
              {customer.name}
            </h2>
            {!customer.active && <Badge className="self-start">Inativo</Badge>}
          </div>
          <Button
            disabled={customer.currentDebt === 0}
            focusableWhenDisabled
            onClick={() => {
              setPaid(null);
              setPaying(true);
            }}
          >
            <HandCoins aria-hidden="true" />
            Registrar pagamento
          </Button>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="text-body-md text-sub">Saldo devedor</dt>
            <dd>
              <Money cents={customer.currentDebt} size="lg" />
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-body-md text-sub">Limite de crédito</dt>
            <dd>
              <Money cents={customer.creditLimit} size="lg" />
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-body-md text-sub">Disponível para fiado</dt>
            <dd>
              <Money
                cents={Math.max(0, customer.creditLimit - customer.currentDebt)}
                size="lg"
              />
            </dd>
          </div>
        </dl>
      </Card>
      <Card title="Extrato" flush aria-busy={loading}>
        <Table
          caption={`Extrato de ${customer.name}`}
          columns={columns}
          rows={data.transactions}
          rowKey={(row) => row.id}
          empty="Nenhuma compra no fiado nem pagamento ainda."
        />
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          noun={{ one: "movimento", many: "movimentos" }}
          loading={loading}
          onPage={(page) => void goTo(page)}
        />
      </Card>
      {paying && (
        <PaymentDialog
          customer={customer}
          store={store}
          paid={paid}
          onPaid={(result) => {
            setPaid(result);
            void reload();
          }}
          onClose={() => setPaying(false)}
        />
      )}
      {paid && (
        <div data-receipt className="hidden flex-col gap-1 print:flex">
          {paymentReceiptLines(store, paid.customer, paid.transaction).map(
            (line, index) => (
              <p key={index} className="min-h-6 text-center text-body-lg">
                {line}
              </p>
            ),
          )}
        </div>
      )}
    </div>
  );
}
