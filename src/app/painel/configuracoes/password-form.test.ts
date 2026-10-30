import { expect, it } from "vitest";
import { passwordFormErrors } from "./password-form";

it("flags a missing current password and a missing new password", () => {
  expect(passwordFormErrors({ current: "", next: "", confirm: "" })).toEqual({
    current: "Informe a senha atual.",
    next: "Use 8 caracteres ou mais, com letras e números.",
  });
});

it("requires the confirmation to match the new password", () => {
  expect(
    passwordFormErrors({
      current: "a",
      next: "nova12345",
      confirm: "nova1234",
    }),
  ).toEqual({ confirm: "As senhas não conferem." });
  expect(
    passwordFormErrors({
      current: "a",
      next: "nova12345",
      confirm: "nova12345",
    }),
  ).toEqual({});
});
