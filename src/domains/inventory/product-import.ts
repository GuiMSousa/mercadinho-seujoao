import "server-only";
import { logActivity } from "@/domains/activity/service";
import { ServiceError } from "@/domains/auth/errors";
import { uniqueViolation } from "@/infrastructure/db/errors";
import { parseCsv } from "@/lib/csv";
import { applyProductImport, ImportRefusal } from "./import-repository";
import { readProductRows, type ImportErrors } from "./import-rows";

type Actor = { id: string; name: string };

// fields: the problem of each file line, keyed by its number.
const refused = (errors: ImportErrors) =>
  new ServiceError(
    422,
    "Nenhum produto foi importado. Corrija as linhas indicadas e envie o arquivo de novo.",
    { fields: errors },
  );

/**
 * Imports a product spreadsheet (CSV): new barcodes are created, known ones updated. All or
 * nothing: any line with a problem refuses the whole file, with every problem by line.
 */
export async function importProducts(actor: Actor, csv: string) {
  const { rows, errors } = readProductRows(parseCsv(csv));
  if (Object.keys(errors).length > 0) throw refused(errors);
  const result = await applyProductImport(rows).catch((error: unknown) => {
    if (error instanceof ImportRefusal) throw refused(error.errors);
    // Another save took one of the barcodes at the same moment.
    if (uniqueViolation(error))
      throw new ServiceError(
        409,
        "Um dos códigos de barras foi cadastrado ao mesmo tempo por outra pessoa. Envie o arquivo de novo.",
      );
    throw error;
  });
  await logActivity({
    user: actor,
    action: "Produtos importados",
    detail: `${result.inserted} ${result.inserted === 1 ? "novo" : "novos"}, ${result.updated} ${result.updated === 1 ? "alterado" : "alterados"}`,
  });
  return result;
}
