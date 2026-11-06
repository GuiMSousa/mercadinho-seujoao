import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ServiceError } from "@/domains/auth/errors";
import { getStatement } from "@/domains/customers/service";
import { getStore } from "@/domains/store/service";
import { requireAdmin } from "../../_lib/require-admin";
import { StatementView } from "../statement-view";

export const metadata: Metadata = { title: "Extrato do cliente — Mkt Control" };

export default async function CustomerStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const [statement, store] = await Promise.all([
    getStatement(id.data, 1).catch((error: unknown) => {
      if (error instanceof ServiceError && error.status === 404) notFound();
      throw error;
    }),
    getStore(),
  ]);
  return (
    <StatementView
      initial={statement}
      store={{
        name: store?.name ?? "Minha loja",
        document: store?.document ?? "",
      }}
    />
  );
}
