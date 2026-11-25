// Creates a user with a random password, printed once. Run: npm run user:create -- <email> "<Nome completo>" <ADMIN|CASHIER>
// An ADMIN on an installation without a store also creates the store ("Minha loja", edited later in
// Configurações), so the first access works without the e-mail of /cadastro and closes the signup.
import { randomBytes } from "node:crypto";
// @next/env is CommonJS; ESM needs the default import.
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
// Imported after the env is loaded: the logger and the pool read it on import/first use.
const { emailSchema } = await import("../src/contracts/auth");
const { hashPassword } = await import("../src/domains/auth/password");
const { insertUser } = await import("../src/domains/users/repository");
const { insertStoreIfMissing } =
  await import("../src/domains/store/repository");
const { closeDatabase } = await import("../src/infrastructure/db");

const [rawEmail, rawName, role] = process.argv.slice(2);
const email = emailSchema.safeParse(rawEmail);
const name = rawName?.trim();
if (!email.success || !name || (role !== "ADMIN" && role !== "CASHIER")) {
  console.error(
    'Uso: npm run user:create -- <email> "<Nome completo>" <ADMIN|CASHIER>',
  );
  process.exit(1);
}

const password = randomBytes(12).toString("base64url");
try {
  // Before the user: if this fails, nothing was created; if the user then fails, a rerun
  // still works, because the store is never created twice (stores.singleton).
  const storeCreated =
    role === "ADMIN" &&
    (await insertStoreIfMissing({
      name: "Minha loja",
      document: "",
      phone: "",
      kind: "",
    }));
  const user = await insertUser({
    name,
    email: email.data,
    passwordHash: await hashPassword(password),
    role,
  });
  if (storeCreated)
    console.log(
      'Loja criada como "Minha loja": troque o nome e os dados em Configurações.',
    );
  console.log(`Usuário ${user.email} (${user.role}) criado.`);
  console.log(`Senha inicial (exibida só agora): ${password}`);
} catch (error) {
  // Drizzle wraps the driver error, and its own message lists the query parameters (the password
  // hash), so only the original pg error is reported. 23505 = unique_violation.
  const cause = (error as { cause?: unknown }).cause ?? error;
  const { code, message } = cause as { code?: string; message?: string };
  console.error(
    code === "23505"
      ? "Esse e-mail já está cadastrado."
      : `Falha ao criar o usuário: ${message}`,
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
