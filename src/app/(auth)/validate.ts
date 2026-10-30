import type { z } from "zod";

/** First message of a failed zod check, so client forms show the same copy as the API. */
export function fieldError(schema: z.ZodType, value: unknown) {
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

/** Runs `[schema, value]` rules and returns `{ field: message }` for the ones that failed. */
export function fieldErrors(rules: Record<string, [z.ZodType, unknown]>) {
  const fields: Record<string, string> = {};
  for (const [name, [schema, value]] of Object.entries(rules)) {
    const message = fieldError(schema, value);
    if (message) fields[name] = message;
  }
  return fields;
}
