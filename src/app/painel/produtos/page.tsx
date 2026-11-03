import type { Metadata } from "next";
import { listCategories, listProducts } from "@/domains/inventory/service";
import { requireAdmin } from "../_lib/require-admin";
import { ProductsView } from "./products-view";

export const metadata: Metadata = { title: "Produtos — Mkt Control" };

export default async function ProductsPage() {
  await requireAdmin();
  const [initial, categories] = await Promise.all([
    listProducts({ search: "", page: 1 }),
    listCategories(),
  ]);
  return <ProductsView initial={initial} categories={categories} />;
}
