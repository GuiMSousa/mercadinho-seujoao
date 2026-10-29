import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

// DESIGN.md is the source of truth for tokens; tokens.css implements it. This keeps them equal.
const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");
const normalize = (value: string) =>
  value.replace(/\s+/g, " ").trim().toLowerCase();

const css = read("./tokens.css").replace(/\/\*[\s\S]*?\*\//g, "");
const darkBlock = /\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
// The same declarations for "no saved theme, OS prefers dark"; not part of the light map.
const systemDark =
  /@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\)\s*\{([^}]*)\}\s*\}/.exec(
    css,
  );

function declarations(source: string) {
  return new Map(
    [...source.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(
      ([, name, value]) => [name, normalize(value)] as const,
    ),
  );
}

const light = declarations(
  css.replace(systemDark?.[0] ?? "", "").replace(darkBlock, ""),
);
const dark = declarations(darkBlock);

// Rows look like | `--token` | `value` | ... ; tables whose header has "Escuro" carry the
// dark value (or "—" when the token keeps its light value) in the third column.
function documentedTokens() {
  const rows: { name: string; value: string; dark?: string }[] = [];
  let themed = false;
  for (const line of read("../DESIGN.md").split("\n")) {
    if (line.startsWith("| Token")) themed = line.includes("Escuro");
    if (!line.startsWith("| `--")) continue;
    const cells = line.split("|").map((cell) => cell.trim().replace(/`/g, ""));
    rows.push({
      name: cells[1],
      value: normalize(cells[2]),
      dark: themed ? cells[3] : undefined,
    });
  }
  return rows;
}

it("declares every token documented in DESIGN.md with the same value", () => {
  for (const token of documentedTokens()) {
    expect(light.get(token.name), token.name).toBe(token.value);
    if (token.dark === undefined) continue;
    expect(dark.get(token.name), `${token.name} (dark)`).toBe(
      token.dark === "—" ? undefined : normalize(token.dark),
    );
  }
});

it("the system-dark block mirrors [data-theme=dark]", () => {
  expect(systemDark, "system-dark block").not.toBeNull();
  expect(declarations(systemDark?.[1] ?? "")).toEqual(dark);
  expect(dark.size).toBeGreaterThan(0);
});

it("documents every token declared in tokens.css", () => {
  const documented = new Set(documentedTokens().map((token) => token.name));
  const undocumented = [...new Set([...light.keys(), ...dark.keys()])].filter(
    (name) => !documented.has(name),
  );
  expect(undocumented).toEqual([]);
});

it("keeps raw colors and px values out of the app stylesheet", () => {
  const globals = read("../src/app/globals.css").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );
  expect(globals).not.toMatch(
    /#[0-9a-f]{3,8}\b|\b\d+px\b|\b(?:rgba?|hsla?|oklch|oklab)\(/i,
  );
});
