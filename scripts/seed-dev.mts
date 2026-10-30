// Dev seed: demo store and users. Idempotent; never overwrites existing data. Run: npm run db:seed
import nextEnv from "@next/env";

if (process.env.NODE_ENV === "production") {
  console.error("db:seed recusado: NODE_ENV=production.");
  process.exit(1);
}
// dev=true: never pick up .env.production* (which may point at the real database).
nextEnv.loadEnvConfig(process.cwd(), true);
// Imported after the env is loaded: the logger and the pool read it on import/first use.
const { hashPassword } = await import("../src/domains/auth/password");
const { findUserByEmail } = await import("../src/domains/auth/repository");
const { findStore, insertStoreIfMissing } =
  await import("../src/domains/store/repository");
const { insertUser, listUsers } =
  await import("../src/domains/users/repository");
const { closeDatabase } = await import("../src/infrastructure/db");
const { getDatabaseUrl } = await import("../src/lib/env");
const { DEMO_EMAILS, DEMO_STORE_DOCUMENT, seedRefusal } =
  await import("../src/lib/seed-guard");

const PASSWORD = "mkt12345";
const [ana, carlos, juliana] = DEMO_EMAILS;
const demoUsers = [
  { name: "Ana Ribeiro", email: ana, role: "ADMIN" },
  { name: "Carlos Souza", email: carlos, role: "CASHIER" },
  { name: "Juliana Lima", email: juliana, role: "CASHIER" },
] as const;

try {
  // Host and database only: the URL carries the password.
  const { hostname, port, pathname } = new URL(getDatabaseUrl());
  console.log(`Banco: ${hostname}:${port}${pathname}`);
  // Seeds only an empty or demo database: the ADMIN it creates has a public password.
  const refusal = seedRefusal({
    storeDocument: (await findStore())?.document,
    userEmails: (await listUsers()).map((user) => user.email),
  });
  if (refusal) {
    console.error(
      `db:seed recusado: ${refusal}. Use um banco de desenvolvimento vazio.`,
    );
    process.exit(1);
  }
  const created = await insertStoreIfMissing({
    name: "Mercadinho Bom Preço",
    document: DEMO_STORE_DOCUMENT,
    phone: "11987654321",
    kind: "Mercadinho",
  });
  console.log(
    created ? "Loja criada." : "Loja já existe: dados mantidos (ignorada).",
  );
  const passwordHash = await hashPassword(PASSWORD);
  for (const user of demoUsers) {
    if (await findUserByEmail(user.email)) {
      console.log(`${user.email}: já existe, senha mantida (ignorado).`);
      continue;
    }
    await insertUser({ ...user, passwordHash });
    console.log(`${user.email} (${user.role}): criado, senha ${PASSWORD}.`);
  }
} finally {
  await closeDatabase();
}
