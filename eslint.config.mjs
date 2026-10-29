// Full Next app profile with server logging and Drizzle boundaries.
import { defineConfig, globalIgnores } from "eslint/config";
import drizzle from "eslint-plugin-drizzle";
import base from "./eslint-rules/next-base.mjs";

const appCode = ["src/**/*.{ts,tsx}", "design-system/**/*.{ts,tsx}"];

// Design-system adherence, ported from the Claude Design export (_adherence.oxlintrc.json).
// Colors, fonts, spacing and radii come from tokens (DESIGN.md); these catch literal escapes.
const tokenEscapes = [
  {
    selector: "Literal[value=/(?:^|\\[|:\\s*)#[0-9a-fA-F]{3,8}\\b/]",
    message: "Raw hex color: use a design-system color token (DESIGN.md).",
  },
  {
    selector: "Literal[value=/\\b(?:rgba?|hsla?|oklch|oklab|hwb|lch|lab)\\(/]",
    message: "Raw color function: use a design-system color token (DESIGN.md).",
  },
  {
    selector: "Literal[value=/\\b\\d+(?:\\.\\d+)?px\\b/]",
    message: "Raw px value: use a spacing, radius or type token (DESIGN.md).",
  },
  {
    selector:
      "Literal[value=/(?:^|[\\s:])-?(?:bg|text|border(?:-[trblxyse])?|ring|outline|fill|stroke|decoration|accent|caret|from|via|to|shadow|rounded(?:-[trblse]{1,2})?|p[trblxyse]?|m[trblxyse]?|gap(?:-[xy])?|space-[xy]|font|tracking|leading)-\\[/]",
    message:
      "Arbitrary value on a token-governed utility: use a design-system token (DESIGN.md).",
  },
  {
    selector: "Property[key.name='fontFamily']",
    message: "Fonts come from the font-sans token (Hanken Grotesk).",
  },
];

export default defineConfig([
  ...base,
  {
    files: appCode,
    plugins: { drizzle },
    rules: {
      "quality/no-direct-console": [
        "error",
        { logger: "the server logger (remove client debug output)" },
      ],
      "quality/no-direct-data-access": [
        "error",
        {
          modules: ["@/infrastructure/db", "@/infrastructure/db/index"],
          bindings: ["db", "getDb"],
          layers: ["/src/app/", "/src/components/"],
          extensions: [".tsx"],
        },
      ],
      "drizzle/enforce-delete-with-where": [
        "error",
        { drizzleObjectName: ["db"] },
      ],
      "drizzle/enforce-update-with-where": [
        "error",
        { drizzleObjectName: ["db"] },
      ],
      "no-restricted-syntax": [
        "error",
        ...tokenEscapes,
        ...tokenEscapes
          .filter(({ selector }) => selector.startsWith("Literal"))
          .map(({ selector, message }) => ({
            selector: selector.replace(
              "Literal[value=",
              "TemplateElement[value.raw=",
            ),
            message,
          })),
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "cn",
              message:
                "Import cn from @ds/lib/cn: it knows the design-system scales (text-body-lg, rounded-control).",
            },
          ],
          patterns: [
            {
              group: ["**/design-system/references/**", "@ds/references/**"],
              message:
                "design-system/references holds static specimens; use @ds/components.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores(["design-system/references/**"]),
]);
