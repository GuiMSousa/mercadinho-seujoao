"use client";

import { useState } from "react";
import { Button } from "@ds/components/button";
import { Tabs } from "@ds/components/tabs";
import { useToast } from "@ds/components/toast";

export function TabsDemo() {
  const [value, setValue] = useState("todos");
  return (
    <Tabs
      aria-label="Filtro de lotes"
      value={value}
      onValueChange={setValue}
      items={[
        { value: "todos", label: "Todos", count: 42 },
        { value: "vencendo", label: "A vencer", count: 5 },
        { value: "vencidos", label: "Vencidos", count: 0 },
      ]}
    />
  );
}

export function ToastDemo() {
  const { toast } = useToast();
  return (
    <>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            tone: "success",
            title: "Venda registrada",
            message: "Cupom enviado para impressão.",
          })
        }
      >
        Sucesso
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({ tone: "danger", title: "Não foi possível salvar" })
        }
      >
        Erro
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            tone: "warning",
            title: "Lote perto do vencimento",
            message: "5 itens vencem em 3 dias.",
          })
        }
      >
        Alerta
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ tone: "info", title: "Sincronizado" })}
      >
        Informação
      </Button>
    </>
  );
}
