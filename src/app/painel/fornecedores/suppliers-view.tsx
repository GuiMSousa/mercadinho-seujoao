"use client";

import { Pencil, Plus, Search } from "lucide-react";
import { useState } from "react";
import type { SupplierRow, SuppliersPage } from "@/contracts/suppliers";
import { formatDocument } from "@/lib/document";
import { Badge } from "@ds/components/badge";
import { Button, IconButton } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Input } from "@ds/components/input";
import { Table, type TableColumn } from "@ds/components/table";
import { Pagination } from "../_lib/pagination";
import { usePagedList } from "../_lib/use-paged-list";
import { SupplierDialog } from "./supplier-dialog";

const fromTablet = "hidden md:table-cell";

export function SuppliersView({ initial }: { initial: SuppliersPage }) {
  const {
    data,
    search,
    loadedSearch,
    loading,
    searchRef,
    changeSearch,
    goTo,
    reload,
  } = usePagedList("/api/admin/suppliers", initial);
  // undefined: closed; null: a new supplier.
  const [editing, setEditing] = useState<SupplierRow | null | undefined>();

  const columns: TableColumn<SupplierRow>[] = [
    {
      key: "name",
      label: "Fornecedor",
      wrap: true,
      render: (supplier) => (
        <span className="flex flex-col items-start wrap-anywhere">
          <span className="font-medium">{supplier.name}</span>
          {supplier.contactPerson && (
            <span className="text-body-sm text-sub">
              {supplier.contactPerson}
            </span>
          )}
          {!supplier.active && (
            <Badge className="mt-1 md:hidden">Inativo</Badge>
          )}
        </span>
      ),
    },
    {
      key: "document",
      label: "CNPJ/CPF",
      className: fromTablet,
      render: (supplier) =>
        supplier.document ? formatDocument(supplier.document) : "—",
    },
    {
      key: "phone",
      label: "WhatsApp",
      render: (supplier) =>
        supplier.phone || <span className="text-sub">Sem número</span>,
    },
    {
      key: "email",
      label: "E-mail",
      className: "hidden lg:table-cell",
      render: (supplier) => supplier.email || "—",
    },
    {
      key: "active",
      label: "Situação",
      className: fromTablet,
      render: (supplier) =>
        supplier.active ? (
          <Badge tone="success">Ativo</Badge>
        ) : (
          <Badge tone="neutral">Inativo</Badge>
        ),
    },
    {
      key: "actions",
      label: <span className="sr-only">Ações</span>,
      align: "right",
      render: (supplier) => (
        <IconButton
          icon={Pencil}
          label={`Editar ${supplier.name}`}
          variant="ghost"
          onClick={() => setEditing(supplier)}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Input
          aria-label="Buscar fornecedor"
          type="search"
          placeholder="Buscar por nome, contato ou CNPJ/CPF"
          prefix={<Search aria-hidden="true" className="size-4" />}
          ref={searchRef}
          maxLength={120}
          value={search}
          onChange={(event) => changeSearch(event.target.value)}
          className="w-full max-w-sm"
        />
        <Button onClick={() => setEditing(null)}>
          <Plus aria-hidden="true" />
          Cadastrar fornecedor
        </Button>
      </div>
      <Card flush aria-busy={loading}>
        <Table
          caption="Fornecedores"
          columns={columns}
          rows={data.suppliers}
          rowKey={(supplier) => supplier.id}
          empty={
            loadedSearch.trim()
              ? "Nenhum fornecedor encontrado. Confira o nome ou o documento."
              : "Cadastre o primeiro fornecedor para enviar pedidos de reposição."
          }
        />
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          noun={{ one: "fornecedor", many: "fornecedores" }}
          loading={loading}
          onPage={(page) => void goTo(page)}
        />
      </Card>
      {editing !== undefined && (
        <SupplierDialog
          supplier={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => void reload()}
        />
      )}
    </div>
  );
}
