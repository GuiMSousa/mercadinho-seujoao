import type { Metadata } from "next";
import { requireAdmin } from "../../_lib/require-admin";
import { ImportView } from "./import-view";

export const metadata: Metadata = {
  title: "Importar produtos — Mkt Control",
};

export default async function ProductImportPage() {
  await requireAdmin();
  return <ImportView />;
}
