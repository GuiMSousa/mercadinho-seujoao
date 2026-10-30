"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActivityPage } from "@/contracts/activity";
import type { UserRow } from "@/contracts/users";
import { Button } from "@ds/components/button";
import { Tabs } from "@ds/components/tabs";
import { ActivityTable } from "./activity-table";
import { TeamTable } from "./team-table";
import { UserDialog } from "./user-dialog";

const tabs = [
  { value: "equipe", label: "Equipe" },
  { value: "atividade", label: "Registro de atividade" },
];

/** `false` is closed, `null` invites a new user, a row edits that user. */
type DialogTarget = false | null | UserRow;

export function UsersView({
  users,
  activity,
  initialTab,
}: {
  users: UserRow[];
  activity: ActivityPage;
  initialTab: "equipe" | "atividade";
}) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);
  const [dialog, setDialog] = useState<DialogTarget>(false);

  function changeTab(value: string) {
    const next = value === "atividade" ? "atividade" : "equipe";
    setTab(next);
    router.replace(next === "atividade" ? "?aba=atividade" : "?", {
      scroll: false,
    });
  }

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          aria-label="Usuários"
          items={tabs}
          value={tab}
          onValueChange={changeTab}
        />
        <Button onClick={() => setDialog(null)}>
          <Plus aria-hidden="true" />
          Adicionar usuário
        </Button>
      </div>
      <div
        role="tabpanel"
        aria-label={tabs.find((item) => item.value === tab)?.label}
      >
        {tab === "equipe" ? (
          <TeamTable users={users} onEdit={setDialog} />
        ) : (
          // Re-keyed on the newest entry so a refresh after an edit replaces the loaded pages.
          <ActivityTable key={activity.items[0]?.id} initial={activity} />
        )}
      </div>
      {dialog !== false && (
        <UserDialog
          key={dialog?.id ?? "new"}
          user={dialog}
          onClose={() => setDialog(false)}
        />
      )}
    </div>
  );
}
