// Dev seed: demo store and users. Idempotent; never overwrites existing data. Run: npm run db:seed
import nextEnv from "@next/env";

if (process.env.NODE_ENV === "production") {
  console.error("db:seed recusado: NODE_ENV=production.");
  process.exit(1);
}
nextEnv.loadEnvConfig(process.cwd());
// Imported after the env is loaded: the logger and the pool read it on import/first use.
const { hashPassword } = await import("../src/domains/auth/password");
const { findUserByEmail } = await import("../src/domains/auth/repository");
const { insertStoreIfMissing } =
  await import("../src/domains/store/repository");
const { insertUser } = await import("../src/domains/users/repository");
const { closeDatabase } = await import("../src/infrastructure/db");
const { getDatabaseUrl } = await import("../src/lib/env");

const PASSWORD = "mkt12345";
const demoUsers = [
  { name: "Ana Ribeiro", email: "ana@bompreco.com.br", role: "ADMIN" },
  { name: "Carlos Souza", email: "carlos@bompreco.com.br", role: "CASHIER" },
  { name: "Juliana Lima", email: "juliana@bompreco.com.br", role: "CASHIER" },
] as const;

try {
  // Host and database only: the URL carries the password.
  const { hostname, port, pathname } = new URL(getDatabaseUrl());
  console.log(`Banco: ${hostname}:${port}${pathname}`);
  const created = await insertStoreIfMissing({
    name: "Mercadinho Bom Preço",
    document: "12345678000190",
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
