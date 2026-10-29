/** Name of the violated unique constraint, or undefined for any other error. Drizzle wraps the pg error as `cause`. */
export function uniqueViolation(error: unknown): string | undefined {
  const cause = (error as { cause?: unknown } | null)?.cause ?? error;
  const { code, constraint } = (cause ?? {}) as {
    code?: string;
    constraint?: string;
  };
  return code === "23505" ? constraint : undefined;
}
