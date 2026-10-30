"use client";

import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeControl } from "@/app/_components/theme-control";
import { Button } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Select } from "@ds/components/select";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";
import { PasswordDialog } from "./password-dialog";
import type { StoreData } from "./store-form";

const idleOptions: { value: StoreData["sessionIdle"]; label: string }[] = [
  { value: "1h", label: "Após 1 hora" },
  { value: "8h", label: "Após 8 horas" },
  { value: "24h", label: "Após 24 horas" },
  { value: "never", label: "Nunca" },
];

export function SecurityCard({
  email,
  store,
  initialTheme,
}: {
  email: string;
  store: StoreData;
  initialTheme?: "light" | "dark";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [idle, setIdle] = useState(store.sessionIdle);
  const [savedIdle, setSavedIdle] = useState(store.sessionIdle);
  // Follow the saved value when it changes elsewhere (another tab or admin).
  if (store.sessionIdle !== savedIdle) {
    setSavedIdle(store.sessionIdle);
    setIdle(store.sessionIdle);
  }
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [ending, setEnding] = useState(false);

  async function changeIdle(value: StoreData["sessionIdle"]) {
    const previous = idle;
    setIdle(value);
    const result = await apiFetch("/api/store", {
      method: "PATCH",
      body: { sessionIdle: value },
    });
    if (!result.ok) {
      setIdle(previous);
      return toast({
        title: "Não foi possível salvar.",
        message: result.errors.error,
        tone: "danger",
      });
    }
    toast({ title: "Preferência salva", tone: "success" });
    router.refresh();
  }

  async function endOtherSessions() {
    setEnding(true);
    const result = await apiFetch("/api/account/sessions/revoke-others", {
      method: "POST",
    });
    setEnding(false);
    if (!result.ok)
      return toast({
        title: "Não foi possível encerrar as sessões.",
        message: result.errors.error,
        tone: "danger",
      });
    toast({
      title: "Outras sessões encerradas",
      message: "Somente este dispositivo continua conectado.",
      tone: "success",
    });
  }

  return (
    <Card title="Conta e segurança" subtitle={email}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-strong">
            Aparência
          </span>
          <ThemeControl variant="tabs" initialTheme={initialTheme} />
        </div>
        <Select
          label="Encerrar sessão por inatividade"
          options={idleOptions}
          value={idle}
          onChange={(event) =>
            void changeIdle(event.target.value as StoreData["sessionIdle"])
          }
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setPasswordOpen(true)}>
            <LockKeyhole aria-hidden="true" />
            Alterar senha
          </Button>
          <Button
            variant="ghost"
            loading={ending}
            onClick={() => void endOtherSessions()}
          >
            Encerrar outras sessões
          </Button>
        </div>
      </div>
      {passwordOpen && (
        <PasswordDialog onClose={() => setPasswordOpen(false)} />
      )}
    </Card>
  );
}
