import type { Metadata } from "next";
import { listActivity } from "@/domains/activity/service";
import { listUsers } from "@/domains/users/service";
import { UsersView } from "./users-view";

export const metadata: Metadata = { title: "Usuários — Mkt Control" };

export default async function UsersPage({
  searchParams,
}: PageProps<"/painel/usuarios">) {
  const { aba } = await searchParams;
  const [users, activity] = await Promise.all([
    listUsers(),
    listActivity({ limit: 50 }),
  ]);
  return (
    <UsersView
      users={users}
      activity={activity}
      initialTab={aba === "atividade" ? "atividade" : "equipe"}
    />
  );
}
