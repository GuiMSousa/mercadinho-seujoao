import type { Metadata } from "next";
import { listSuppliers } from "@/domains/suppliers/service";
import { requireAdmin } from "../_lib/require-admin";
import { SuppliersView } from "./suppliers-view";

export const metadata: Metadata = { title: "Fornecedores — Mkt Control" };

export default async function SuppliersPage() {
  await requireAdmin();
  return (
    <SuppliersView initial={await listSuppliers({ search: "", page: 1 })} />
  );
}
