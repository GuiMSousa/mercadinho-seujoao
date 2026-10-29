import { describe, expect, it } from "vitest";
import { passwordRuleSchema } from "@/contracts/auth";
import { hashPassword, verifyPassword } from "./password";

it("verifies the right password and rejects a wrong one", async () => {
  const stored = await hashPassword("correct horse battery staple");
  expect(stored).toMatch(/^scrypt\$131072\$8\$1\$/);
  expect(stored).not.toContain("correct horse");
  await expect(
    verifyPassword("correct horse battery staple", stored),
  ).resolves.toBe(true);
  await expect(
    verifyPassword("Correct horse battery staple", stored),
  ).resolves.toBe(false);
});

it("salts every hash and rejects malformed stored values", async () => {
  const [first, second] = await Promise.all([
    hashPassword("same"),
    hashPassword("same"),
  ]);
  expect(first).not.toBe(second);
  await expect(verifyPassword("same", "plain-text")).resolves.toBe(false);
  await expect(verifyPassword("same", "bcrypt$10$abc$def")).resolves.toBe(
    false,
  );
});

describe("passwordRuleSchema", () => {
  it.each(["abcd1234", "Senha123!"])("accepts %s", (value) => {
    expect(passwordRuleSchema.safeParse(value).success).toBe(true);
  });

  it.each([
    ["letters only", "abcdefgh"],
    ["digits only", "12345678"],
    ["too short", "a1"],
    ["257 characters", `a1${"x".repeat(255)}`],
  ])("rejects %s with the friendly message", (_label, value) => {
    const result = passwordRuleSchema.safeParse(value);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Use 8 caracteres ou mais, com letras e números.",
    );
  });
});
