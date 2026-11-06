import { expect, it } from "vitest";
import { parseCsv } from "./csv";

it("reads semicolon files from Excel, with a BOM and CRLF line ends", () => {
  expect(
    parseCsv("\uFEFFnome;preco\r\nCafé;18,49\r\n\r\nArroz;29,90\r\n"),
  ).toEqual([
    { line: 1, cells: ["nome", "preco"] },
    { line: 2, cells: ["Café", "18,49"] },
    { line: 4, cells: ["Arroz", "29,90"] },
  ]);
});

it("reads comma files, with quoted cells holding delimiters, quotes and line breaks", () => {
  expect(
    parseCsv('nome,obs\n"Leite, integral","diz ""1 L"""\n"Pão\nfrancês",x'),
  ).toEqual([
    { line: 1, cells: ["nome", "obs"] },
    { line: 2, cells: ["Leite, integral", 'diz "1 L"'] },
    { line: 3, cells: ["Pão\nfrancês", "x"] },
  ]);
});

it("answers nothing for an empty file", () => {
  expect(parseCsv("")).toEqual([]);
  expect(parseCsv("\n\n")).toEqual([]);
});
