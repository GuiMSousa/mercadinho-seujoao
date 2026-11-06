/**
 * Rows of a CSV file as text cells. The delimiter is the header's: `;` (Excel in Portuguese) or
 * `,`. Quoted cells may hold delimiters, line breaks and doubled quotes; a BOM is dropped and
 * blank lines are skipped. Each row keeps the line where it starts, for error messages.
 */
export function parseCsv(text: string) {
  const source = text.replace(/^\uFEFF/, "");
  const header = source.slice(0, source.search(/\r?\n|$/));
  const delimiter =
    header.split(";").length > header.split(",").length ? ";" : ",";
  const rows: { line: number; cells: string[] }[] = [];
  let cells: string[] = [];
  let cell = "";
  let quoted = false;
  let line = 1;
  let start = 1;
  const endRow = () => {
    cells.push(cell);
    if (cells.some((value) => value.trim() !== ""))
      rows.push({ line: start, cells });
    cells = [];
    cell = "";
  };
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"';
        index++;
      } else if (char === '"') quoted = false;
      else {
        if (char === "\n") line++;
        cell += char;
      }
    } else if (char === '"') quoted = true;
    else if (char === delimiter) {
      cells.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index++;
      endRow();
      line++;
      start = line;
    } else cell += char;
  }
  endRow();
  return rows;
}
