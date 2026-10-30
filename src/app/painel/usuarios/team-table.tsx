"use client";

import type { UserRow } from "@/contracts/users";
import { Badge } from "@ds/components/badge";
import { Button } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Table, type TableColumn } from "@ds/components/table";
import { formatDateTime } from "../_lib/format";

export const ROLE_LABEL = {
  ADMIN: "Administrador",
  CASHIER: "Operador de caixa",
} as const;

export function TeamTable({
  users,
  onEdit,
}: {
  users: UserRow[];
  onEdit: (user: UserRow) => void;
}) {
  const columns: TableColumn<UserRow>[] = [
    {
      key: "name",
      label: "Nome",
      render: (user) => (
        <span className="flex flex-col">
          <span className="font-medium">{user.name}</span>
          <span className="text-body-sm text-sub">{user.email}</span>
        </span>
      ),
    },
    {
      key: "role",
      label: "Perfil",
      render: (user) => (
        <Badge tone={user.role === "ADMIN" ? "info" : "neutral"}>
          {ROLE_LABEL[user.role]}
        </Badge>
      ),
    },
    {
      key: "active",
      label: "Acesso",
      render: (user) =>
        user.pending ? (
          <Badge tone="warning">Convite pendente</Badge>
        ) : user.active ? (
          <Badge tone="success">Ativo</Badge>
        ) : (
          <Badge tone="neutral">Desativado</Badge>
        ),
    },
    {
      key: "last",
      label: "Último acesso",
      render: (user) => (
        <span className="text-sub">
          {user.lastLoginAt
            ? formatDateTime(user.lastLoginAt)
            : "Nunca acessou"}
        </span>
      ),
    },
    {
      key: "actions",
      label: <span className="sr-only">Ações</span>,
      align: "right",
      render: (user) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Editar ${user.name}`}
          onClick={() => onEdit(user)}
        >
          Editar
        </Button>
      ),
    },
  ];
  return (
    <Card flush>
      <Table
        caption="Equipe"
        columns={columns}
        rows={users}
        rowKey={(user) => user.id}
      />
    </Card>
  );
}
