import { expect, it } from "vitest";
import { formatDocument, onlyDigits } from "./document";

it("keeps only the digits", () => {
  expect(onlyDigits("12.345.678/0001-90")).toBe("12345678000190");
  expect(onlyDigits("abc")).toBe("");
});

it("masks a CPF progressively", () => {
  expect(formatDocument("123")).toBe("123");
  expect(formatDocument("1234")).toBe("123.4");
  expect(formatDocument("1234567")).toBe("123.456.7");
  expect(formatDocument("123.456.789-0")).toBe("123.456.789-0");
  expect(formatDocument("12345678901")).toBe("123.456.789-01");
});

it("masks a CNPJ once there are more than 11 digits and caps at 14", () => {
  expect(formatDocument("123456789012")).toBe("12.345.678/9012");
  expect(formatDocument("12345678000190")).toBe("12.345.678/0001-90");
  expect(formatDocument("1234567800019099")).toBe("12.345.678/0001-90");
});
