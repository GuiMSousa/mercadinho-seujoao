"use client";

import { useEffect, useRef, useState } from "react";
import type { ActivityItem, ActivityPage } from "@/contracts/activity";
import { Button } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Table, type TableColumn } from "@ds/components/table";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";
import { formatDateTime } from "../_lib/format";

const columns: TableColumn<ActivityItem>[] = [
  { key: "at", label: "Quando", render: (item) => formatDateTime(item.at) },
  { key: "user", label: "Usuário", render: (item) => item.userName },
  {
    key: "action",
    label: "Ação",
    render: (item) => <span className="font-medium">{item.action}</span>,
  },
  {
    key: "detail",
    label: "Detalhe",
    wrap: true,
    render: (item) => <span className="text-sub">{item.detail}</span>,
  },
];

export function ActivityTable({ initial }: { initial: ActivityPage }) {
  const { toast } = useToast();
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const hadMore = useRef(Boolean(initial.nextCursor));
  // "Carregar mais" vanishes after the last page; keep the keyboard focus inside the list.
  useEffect(() => {
    if (hadMore.current && !cursor)
      card.current?.querySelector<HTMLElement>('[data-slot="table"]')?.focus();
    hadMore.current = Boolean(cursor);
  }, [cursor]);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    const result = await apiFetch<ActivityPage>(
      `/api/admin/activity?cursor=${encodeURIComponent(cursor)}`,
    );
    setLoading(false);
    if (!result.ok)
      return toast({
        title: "Não foi possível carregar mais",
        message: result.errors.error,
        tone: "danger",
      });
    setItems((current) => [...current, ...result.data.items]);
    setCursor(result.data.nextCursor);
  }

  return (
    <div ref={card}>
      <Card flush>
        <Table
          caption="Registro de atividade"
          columns={columns}
          rows={items}
          rowKey={(item) => item.id}
          dense
          empty="Nenhuma atividade registrada ainda."
        />
        {cursor && (
          <div className="flex justify-center p-4">
            <Button
              variant="secondary"
              loading={loading}
              onClick={() => void loadMore()}
            >
              Carregar mais
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
