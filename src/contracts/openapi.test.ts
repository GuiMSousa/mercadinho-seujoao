// npm run spec:check — the contract is valid, committed and covers every API route.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPIV3_1 } from "openapi-types";
import { expect, it } from "vitest";
import { buildOpenApiDocument } from "./openapi";

const document = buildOpenApiDocument();
const apiDir = fileURLToPath(new URL("../app/api", import.meta.url));
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

it("is a valid OpenAPI 3.1 document", async () => {
  await expect(
    SwaggerParser.validate(structuredClone(document) as OpenAPIV3_1.Document),
  ).resolves.toBeDefined();
});

it("matches the committed openapi.json (regenerate with npm run spec:generate)", async () => {
  const committed: unknown = JSON.parse(
    await readFile(new URL("./openapi.json", import.meta.url), "utf8"),
  );
  expect(committed).toEqual(JSON.parse(JSON.stringify(document)));
});

it("documents exactly the operations exported by the route handlers", async () => {
  const implemented: string[] = [];
  for (const file of await readdir(apiDir, { recursive: true })) {
    if (path.basename(file) !== "route.ts") continue;
    const route = `/api/${path.dirname(file).split(path.sep).join("/")}`;
    const source = await readFile(path.join(apiDir, file), "utf8");
    for (const method of METHODS) {
      if (new RegExp(`export (async )?function ${method}\\b`).test(source)) {
        implemented.push(`${method} ${route}`);
      }
    }
  }
  const documented = Object.entries(document.paths).flatMap(
    ([route, operations]) =>
      Object.keys(operations).map(
        (method) => `${method.toUpperCase()} ${route}`,
      ),
  );
  expect(implemented.sort()).toEqual(documented.sort());
});
