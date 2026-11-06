import { createProductSchema, MAX_INTEGER } from "@/contracts/inventory";
import { parseCents, parseQuantity } from "@/lib/amounts";

/** The spreadsheet's columns, by their header (accents, case and spacing do not matter). */
const IMPORT_COLUMNS = [
  "nome",
  "codigo_barras",
  "categoria",
  "preco_custo",
  "preco_venda",
  "unidade",
  "estoque_minimo",
] as const;

export const MAX_IMPORT_ROWS = 5000;

type Unit = "UN" | "KG" | "L";

export type ImportRow = {
  line: number;
  barcode: string;
  name: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  unit: Unit;
  minStock: number;
};

/** Errors by file line ("3": "..."), as the import answers them. */
export type ImportErrors = Record<string, string>;

// "Código de barras", "codigo_barras" and "CODIGO BARRAS" are one column: no accents, case,
// spacing or connecting "de/do/da".
const columnKey = (header: string) =>
  header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_(de|do|da)_/g, "_")
    .replace(/^_|_$/g, "");

// "12,90" and "1.234,56" as typed in Brazil, or "12.90" as some systems export.
function cents(text: string) {
  const value = text.trim();
  const amount = parseCents(
    /^\d+\.\d{1,2}$/.test(value) ? value.replace(".", ",") : value,
  );
  return amount !== null && amount <= MAX_INTEGER ? amount : null;
}

const firstIssue = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

/**
 * The products of the spreadsheet's rows (header first), with the same rules as the product form,
 * or the errors of each line. A barcode twice in the file is an error on its second line.
 */
export function readProductRows(rows: { line: number; cells: string[] }[]): {
  rows: ImportRow[];
  errors: ImportErrors;
} {
  const [header, ...body] = rows;
  if (!header) return { rows: [], errors: { "1": "O arquivo está vazio." } };
  const keys = header.cells.map(columnKey);
  const missing = IMPORT_COLUMNS.filter((column) => !keys.includes(column));
  const refuse = (message: string) => ({
    rows: [],
    errors: { [header.line]: message },
  });
  if (missing.length > 0)
    return refuse(`Faltam as colunas: ${missing.join(", ")}.`);
  if (body.length === 0) return refuse("Nenhum produto abaixo do cabeçalho.");
  if (body.length > MAX_IMPORT_ROWS)
    return refuse(`Use até ${MAX_IMPORT_ROWS} produtos por arquivo.`);

  const errors: ImportErrors = {};
  const parsed: ImportRow[] = [];
  const firstLine = new Map<string, number>();
  for (const { line, cells } of body) {
    const cell = (column: (typeof IMPORT_COLUMNS)[number]) =>
      (cells[keys.indexOf(column)] ?? "").trim();
    const problems: string[] = [];
    const barcode = createProductSchema.shape.barcode.safeParse(
      cell("codigo_barras"),
    );
    const name = createProductSchema.shape.name.safeParse(cell("nome"));
    const category = cell("categoria");
    const unit = createProductSchema.shape.unit.safeParse(
      cell("unidade").toUpperCase(),
    );
    const costPrice = cents(cell("preco_custo"));
    const sellPrice = cents(cell("preco_venda"));
    const minStock = unit.success
      ? parseQuantity(cell("estoque_minimo") || "0", unit.data)
      : 0;

    if (!barcode.success) problems.push(firstIssue(barcode) as string);
    if (!name.success) problems.push(firstIssue(name) as string);
    if (!category) problems.push("Informe a categoria.");
    else if (category.length > 120)
      problems.push("Use até 120 caracteres na categoria.");
    if (!unit.success) problems.push("A unidade é UN, KG ou L.");
    if (costPrice === null)
      problems.push("Preço de custo inválido. Ex.: 12,90");
    if (sellPrice === null)
      problems.push("Preço de venda inválido. Ex.: 18,49");
    if (minStock === null || minStock > MAX_INTEGER)
      problems.push(
        unit.data === "UN"
          ? "Estoque mínimo: um número inteiro."
          : "Estoque mínimo: até 3 casas decimais. Ex.: 1,500",
      );
    const repeated = barcode.success && firstLine.get(barcode.data);
    if (repeated)
      problems.push(`Código de barras repetido (linha ${repeated}).`);

    if (problems.length > 0) {
      errors[line] = problems.join(" ");
      continue;
    }
    if (barcode.success) firstLine.set(barcode.data, line);
    parsed.push({
      line,
      barcode: barcode.data as string,
      name: name.data as string,
      category,
      costPrice: costPrice as number,
      sellPrice: sellPrice as number,
      unit: unit.data as Unit,
      minStock: minStock as number,
    });
  }
  return { rows: parsed, errors };
}
