import { z } from "zod";

// OpenAPI 3.1 schemas are JSON Schema 2020-12, which is what Zod emits; only $schema is dropped.
export function jsonSchema(
  schema: z.ZodType,
  io: "input" | "output" = "output",
) {
  const json = z.toJSONSchema(schema, { io });
  delete json.$schema;
  return json;
}

export const json = (name: string) => ({
  "application/json": { schema: { $ref: `#/components/schemas/${name}` } },
});
export const error = (description: string) => ({
  description,
  content: json("Error"),
});
export const formError = (description: string) => ({
  description,
  content: json("FormError"),
});
export const retryAfter = {
  "Retry-After": {
    description: "Segundos até a próxima tentativa.",
    schema: { type: "integer" },
  },
};
export const tooMany = (description: string) => ({
  description,
  headers: retryAfter,
  content: json("Error"),
});
export const body = (name: string) => ({ required: true, content: json(name) });
