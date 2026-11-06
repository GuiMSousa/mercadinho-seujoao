import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

// WCAG 1.4.3: text needs 4.5:1 against what is behind it, in both themes. The pairs below are
// the ones the components put together (Badge and semaphore, Button, Money, Toast, sidebar).
const css = readFileSync(
  new URL("./tokens.css", import.meta.url),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

const declarations = (block: string) =>
  new Map(
    [...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(
      ([, name, value]) => [name, value.trim()] as const,
    ),
  );

const light = declarations(/:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? "");
const themes = {
  light,
  dark: new Map([
    ...light,
    ...declarations(/\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? ""),
  ]),
};
type Theme = Map<string, string>;
type Rgba = [number, number, number, number];

function color(theme: Theme, token: string): Rgba {
  let value = theme.get(token);
  for (let alias = /^var\((--[\w-]+)\)$/.exec(value ?? ""); alias;) {
    value = theme.get(alias[1]);
    alias = /^var\((--[\w-]+)\)$/.exec(value ?? "");
  }
  const hex = /^#([0-9a-f]{6})$/i.exec(value ?? "");
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgba =
    /^rgba\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\s*\)$/.exec(
      value ?? "",
    );
  if (rgba) return rgba.slice(1).map(Number) as Rgba;
  throw new Error(`${token}: no color in "${value}"`);
}

/** A translucent color as it shows over an opaque one. */
const over = ([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba => [
  r * a + br * (1 - a),
  g * a + bg * (1 - a),
  b * a + bb * (1 - a),
  1,
];

function luminance([r, g, b]: Rgba) {
  const linear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

const ratio = (a: Rgba, b: Rgba) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};

const SURFACES = ["--bg-app", "--surface-card", "--surface-sunken"];
type Pair = { text: string; background: string; base?: string };

const PAIRS: Pair[] = [
  // Text, amounts and status words (the stock semaphore writes them on the card) on every surface.
  ...[
    "--text-strong",
    "--text-body",
    "--text-sub",
    "--text-link",
    "--money-in",
    "--money-out",
    "--success-fg",
    "--warning-fg",
    "--danger-fg",
    "--info-fg",
  ].flatMap((text) => SURFACES.map((background) => ({ text, background }))),
  // Badges and the semaphore: tone text on its tint, the tint over any surface.
  ...["success", "danger", "warning", "info", "neutral"].flatMap((tone) =>
    SURFACES.map((base) => ({
      text: `--${tone}-fg`,
      background: `--${tone}-bg`,
      base,
    })),
  ),
  // Buttons, at rest and on hover.
  { text: "--text-inverse", background: "--action-primary" },
  { text: "--text-inverse", background: "--action-primary-hover" },
  { text: "--text-on-color", background: "--action-brand" },
  { text: "--text-on-color", background: "--action-brand-hover" },
  { text: "--text-on-color", background: "--action-danger" },
  { text: "--text-on-color", background: "--action-danger-hover" },
  { text: "--text-strong", background: "--surface-hover" },
  { text: "--text-strong", background: "--control-soft" },
  { text: "--text-strong", background: "--control-soft-hover" },
  ...["--danger-bg", "--danger-soft-hover"].map((background) => ({
    text: "--danger-fg",
    background,
    base: "--surface-card",
  })),
  // Sidebar's current page, and the toast (on the primary fill).
  {
    text: "--selected-fg",
    background: "--selected-bg",
    base: "--surface-card",
  },
  { text: "--text-inverse-sub", background: "--action-primary" },
];

it.each(Object.entries(themes))(
  "keeps text at 4.5:1 or more in the %s theme",
  (_, theme) => {
    const failures = PAIRS.flatMap(({ text, background, base }) => {
      const behind = over(
        color(theme, background),
        color(theme, base ?? "--surface-card"),
      );
      const value = ratio(over(color(theme, text), behind), behind);
      return value >= 4.5
        ? []
        : [
            `${text} on ${background}${base ? ` over ${base}` : ""}: ${value.toFixed(2)}`,
          ];
    });
    expect(failures).toEqual([]);
  },
);
