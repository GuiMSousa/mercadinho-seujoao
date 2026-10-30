import { expect, it } from "vitest";
import { codeSchema, emailSchema, passwordRuleSchema } from "@/contracts/auth";
import { fieldError, fieldErrors } from "./validate";

it("returns the contract message for an invalid value and nothing for a valid one", () => {
  expect(fieldError(emailSchema, "abc")).toBe("Informe um e-mail válido.");
  expect(fieldError(emailSchema, " ana@loja.com ")).toBeUndefined();
  expect(fieldError(codeSchema, "12345")).toBe(
    "Digite os 6 números do código.",
  );
});

it("collects only the failing fields", () => {
  expect(
    fieldErrors({
      email: [emailSchema, "ana@loja.com"],
      password: [passwordRuleSchema, "curta"],
    }),
  ).toEqual({ password: "Use 8 caracteres ou mais, com letras e números." });
});
