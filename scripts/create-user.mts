// Creates a user with a random password, printed once. Run: npm run user:create -- <usuario> <ADMIN|CASHIER>
import { randomBytes } from "node:crypto";
// @next/env is CommonJS; ESM needs the default import.
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
// Imported after the env is loaded: the logger and the pool read it on import/first use.
const { loginRequestSchema } = await import("../src/contracts/auth");
const { hashPassword } = await import("../src/domains/auth/password");
const { insertUser } = await import("../src/domains/auth/repository");
const { closeDatabase } = await import("../src/infrastructure/db");

const [rawUsername, role] = process.argv.slice(2);
const username = loginRequestSchema.shape.username.safeParse(rawUsername);
if (!username.success || (role !== "ADMIN" && role !== "CASHIER")) {
  console.error("Uso: npm run user:create -- <usuario> <ADMIN|CASHIER>");
  process.exit(1);
}

const password = randomBytes(12).toString("base64url");
try {
  const user = await insertUser({
    username: username.data,
    passwordHash: await hashPassword(password),
    role,
  });
  console.log(`Usuário ${user.username} (${user.role}) criado.`);
  console.log(`Senha inicial (exibida só agora): ${password}`);
} catch (error) {
  // Drizzle wraps the driver error, and its own message lists the query parameters (the password
  // hash), so only the original pg error is reported. 23505 = unique_violation.
  const cause = (error as { cause?: unknown }).cause ?? error;
  const { code, message } = cause as { code?: string; message?: string };
  console.error(
    code === "23505"
      ? "Esse usuário já existe."
      : `Falha ao criar o usuário: ${message}`,
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
