// Demo identity shared by scripts/seed-dev.mts and its guard.
export const DEMO_STORE_DOCUMENT = "12345678000190";
export const DEMO_EMAILS = [
  "ana@bompreco.com.br",
  "carlos@bompreco.com.br",
  "juliana@bompreco.com.br",
] as const;

/**
 * Returns why the seed must not run on this database, or null when it is empty or already the
 * demo database. The seed creates an ADMIN with a public password, so it must never reach real data.
 */
export function seedRefusal(existing: {
  storeDocument: string | undefined;
  userEmails: string[];
}) {
  if (
    existing.storeDocument !== undefined &&
    existing.storeDocument !== DEMO_STORE_DOCUMENT
  )
    return "já existe uma loja que não é a de demonstração";
  const foreign = existing.userEmails.find(
    (email) => !(DEMO_EMAILS as readonly string[]).includes(email),
  );
  if (foreign !== undefined)
    return "já existem usuários que não são os de demonstração";
  return null;
}
