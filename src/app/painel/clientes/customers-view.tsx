"use client";

import { NotebookText, Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { CustomerRow, CustomersPage } from "@/contracts/customers";
import { formatDocument } from "@/lib/document";
import { Badge } from "@ds/components/badge";
import { Button, IconButton, buttonVariants } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Input } from "@ds/components/input";
import { Money } from "@ds/components/money";
import { Table, type TableColumn } from "@ds/components/table";
import { cn } from "@ds/lib/cn";
import { Pagination } from "../_lib/pagination";
import { usePagedList } from "../_lib/use-paged-list";
import { CustomerDialog } from "./customer-dialog";

const fromTablet = "hidden md:table-cell";

/** The debt with a warning when it passed the limit (the limit was lowered after the purchases). */
function DebtCell({ customer }: { customer: CustomerRow }) {
  return (
    <span className="flex flex-col items-end gap-1">
      <Money cents={customer.currentDebt} size="sm" />
      {customer.currentDebt > customer.creditLimit && (
        <Badge tone="danger" size="sm" dot>
          Acima do limite
        </Badge>
      )}
    </span>
  );
}

export function CustomersView({ initial }: { initial: CustomersPage }) {
  const {
    data,
    search,
    loadedSearch,
    loading,
    searchRef,
    changeSearch,
    goTo,
    reload,
  } = usePagedList("/api/admin/customers", initial);
  // undefined: closed; null: a new customer.
  const [editing, setEditing] = useState<CustomerRow | null | undefined>();

  const columns: TableColumn<CustomerRow>[] = [
    {
      key: "name",
      label: "Cliente",
      wrap: true,
      render: (customer) => (
        <span className="flex flex-col items-start wrap-anywhere">
          <span className="font-medium">{customer.name}</span>
          {customer.phone && (
            <span className="text-body-sm text-sub">{customer.phone}</span>
          )}
          {!customer.active && (
            <Badge className="mt-1 md:hidden">Inativo</Badge>
          )}
        </span>
      ),
    },
    {
      key: "document",
      label: "CPF/CNPJ",
      className: "hidden lg:table-cell",
      render: (customer) =>
        customer.document ? formatDocument(customer.document) : "—",
    },
    {
      key: "limit",
      label: "Limite",
      align: "right",
      className: fromTablet,
      render: (customer) => <Money cents={customer.creditLimit} size="sm" />,
    },
    {
      key: "debt",
      label: "Saldo devedor",
      align: "right",
      render: (customer) => <DebtCell customer={customer} />,
    },
    {
      key: "active",
      label: "Situação",
      className: fromTablet,
      render: (customer) =>
        customer.active ? (
          <Badge tone="success">Ativo</Badge>
        ) : (
          <Badge tone="neutral">Inativo</Badge>
        ),
    },
    {
      key: "actions",
      label: <span className="sr-only">Ações</span>,
      align: "right",
      render: (customer) => (
        <span className="flex justify-end gap-1">
          <Link
            href={`/painel/clientes/${customer.id}`}
            aria-label={`Extrato de ${customer.name}`}
            title={`Extrato de ${customer.name}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "size-control-md px-0",
            )}
          >
            <NotebookText aria-hidden="true" className="size-5" />
          </Link>
          <IconButton
            icon={Pencil}
            label={`Editar ${customer.name}`}
            variant="ghost"
            onClick={() => setEditing(customer)}
          />
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Input
          aria-label="Buscar cliente"
          type="search"
          placeholder="Buscar por nome, WhatsApp ou CPF/CNPJ"
          prefix={<Search aria-hidden="true" className="size-4" />}
          ref={searchRef}
          maxLength={120}
          value={search}
          onChange={(event) => changeSearch(event.target.value)}
          className="w-full max-w-sm"
        />
        <Button onClick={() => setEditing(null)}>
          <Plus aria-hidden="true" />
          Cadastrar cliente
        </Button>
      </div>
      <Card flush aria-busy={loading}>
        <Table
          caption="Clientes"
          columns={columns}
          rows={data.customers}
          rowKey={(customer) => customer.id}
          empty={
            loadedSearch.trim()
              ? "Nenhum cliente encontrado. Confira o nome, o WhatsApp ou o documento."
              : "Cadastre o primeiro cliente para vender no fiado."
          }
        />
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          noun={{ one: "cliente", many: "clientes" }}
          loading={loading}
          onPage={(page) => void goTo(page)}
        />
      </Card>
      {editing !== undefined && (
        <CustomerDialog
          customer={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => void reload()}
        />
      )}
    </div>
  );
}
