import type { Metadata } from "next";
import { listCustomers } from "@/domains/customers/service";
import { requireAdmin } from "../_lib/require-admin";
import { CustomersView } from "./customers-view";

export const metadata: Metadata = { title: "Clientes — Mkt Control" };

export default async function CustomersPage() {
  await requireAdmin();
  return (
    <CustomersView initial={await listCustomers({ search: "", page: 1 })} />
  );
}
