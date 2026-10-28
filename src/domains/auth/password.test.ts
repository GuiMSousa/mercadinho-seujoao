import { expect, it } from "vitest";
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
