import { expect, it } from "vitest";
import { initialValues, type SignupValues } from "./signup-steps";
import {
  signupPayload,
  validateAccount,
  validateCode,
  validateStore,
} from "./signup-validation";

const valid: SignupValues = {
  ...initialValues,
  name: "Ana Souza",
  email: "ana@loja.com",
  password: "senha1234",
  confirm: "senha1234",
  storeName: "Bom Preço",
  document: "11.222.333/0001-81",
  terms: true,
};

it("accepts valid account and store data", () => {
  expect(validateAccount(valid)).toEqual({});
  expect(validateStore(valid)).toEqual({});
});

it("reports each invalid account field with the contract copy", () => {
  expect(
    validateAccount({
      ...valid,
      name: "Ana",
      email: "x",
      password: "abc",
      confirm: "d",
    }),
  ).toEqual({
    name: "Informe nome e sobrenome.",
    email: "Informe um e-mail válido.",
    password: "Use 8 caracteres ou mais, com letras e números.",
    confirm: "As senhas não conferem.",
  });
});

it("reports invalid store data", () => {
  expect(
    validateStore({ ...valid, storeName: " ", document: "123", terms: false }),
  ).toEqual({
    storeName: "Informe o nome da loja.",
    document: "CNPJ ou CPF incompleto.",
    terms: "Aceite os termos para continuar.",
  });
});

it("checks the code", () => {
  expect(validateCode("123456")).toBeUndefined();
  expect(validateCode("123")).toBe("Digite os 6 números do código.");
});

it("builds an equal payload for equal values and a different one after an edit", () => {
  const sent = JSON.stringify(signupPayload(valid));
  expect(JSON.stringify(signupPayload({ ...valid }))).toBe(sent);
  expect(JSON.stringify(signupPayload({ ...valid, phone: "  " }))).toBe(sent);
  expect(
    JSON.stringify(signupPayload({ ...valid, storeName: "Outra" })),
  ).not.toBe(sent);
});
