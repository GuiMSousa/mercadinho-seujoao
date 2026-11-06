import { expect, it } from "vitest";
import { parseCsv } from "@/lib/csv";
import { MAX_IMPORT_ROWS, readProductRows } from "./import-rows";

const read = (text: string) => readProductRows(parseCsv(text));
const HEADER =
  "NOME;Código de Barras;Categoria;Preço de custo;Preço de venda;Unidade;Estoque mínimo";

it("reads the columns whatever their accents, case, spacing or 'de'", () => {
  expect(read(`${HEADER}\nCafé;789;Mercearia;1.234,56;18.49;un;6`)).toEqual({
    rows: [
      {
        line: 2,
        barcode: "789",
        name: "Café",
        category: "Mercearia",
        costPrice: 123456,
        sellPrice: 1849,
        unit: "UN",
        minStock: 6,
      },
    ],
    errors: {},
  });
});

it("turns weights and volumes into grams and milliliters, and an empty minimum into zero", () => {
  const { rows } = read(
    `${HEADER}\nBanana;1;Hortifrúti;4,00;6,99;KG;2,5\nLeite;2;Laticínios;3,10;4,99;L;`,
  );
  expect(rows.map((row) => [row.unit, row.minStock])).toEqual([
    ["KG", 2500],
    ["L", 0],
  ]);
});

it("explains every problem of each line, and a barcode used twice", () => {
  const { rows, errors } = read(
    [
      HEADER,
      "Café;789;Mercearia;12,90;18,49;UN;6",
      ";;;12,9x;;CX;",
      "Pão;789;Padaria;0,50;0,90;UN;1,5",
    ].join("\n"),
  );
  expect(rows).toHaveLength(1);
  expect(errors).toEqual({
    "3": "Informe o código de barras. Informe o nome. Informe a categoria. A unidade é UN, KG ou L. Preço de custo inválido. Ex.: 12,90 Preço de venda inválido. Ex.: 18,49",
    "4": "Estoque mínimo: um número inteiro. Código de barras repetido (linha 2).",
  });
});

it("refuses a file without the columns, without products or with too many", () => {
  expect(read("").errors).toEqual({ "1": "O arquivo está vazio." });
  expect(read("nome;preco\nCafé;1").errors["1"]).toBe(
    "Faltam as colunas: codigo_barras, categoria, preco_custo, preco_venda, unidade, estoque_minimo.",
  );
  expect(read(HEADER).errors["1"]).toBe("Nenhum produto abaixo do cabeçalho.");
  const many = Array.from(
    { length: MAX_IMPORT_ROWS + 1 },
    (_, index) => `P;${index};C;1;1;UN;0`,
  );
  expect(read([HEADER, ...many].join("\n")).errors["1"]).toBe(
    `Use até ${MAX_IMPORT_ROWS} produtos por arquivo.`,
  );
});
