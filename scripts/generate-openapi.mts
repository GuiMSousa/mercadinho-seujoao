// Writes the API contract built from the Zod schemas. Run: npm run spec:generate
import { writeFile } from "node:fs/promises";
import { buildOpenApiDocument } from "../src/contracts/openapi";

const target = new URL("../src/contracts/openapi.json", import.meta.url);
await writeFile(target, `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`);
console.log("src/contracts/openapi.json atualizado.");
