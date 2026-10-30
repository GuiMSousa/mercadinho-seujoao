import { expect, it } from "vitest";
import { greeting, longDate } from "./greeting";

it("greets by the hour in São Paulo, using the first name", () => {
  // 12:00Z is 09:00 in São Paulo (UTC-3).
  expect(greeting(new Date("2026-10-29T12:00:00Z"), "Ana Maria Souza")).toBe(
    "Bom dia, Ana",
  );
  expect(greeting(new Date("2026-10-29T15:00:00Z"), "Ana")).toBe(
    "Boa tarde, Ana",
  );
  expect(greeting(new Date("2026-10-29T20:59:00Z"), "Ana")).toBe(
    "Boa tarde, Ana",
  );
  expect(greeting(new Date("2026-10-29T21:00:00Z"), "Ana")).toBe(
    "Boa noite, Ana",
  );
  // 02:00Z is 23:00 of the previous day in São Paulo.
  expect(greeting(new Date("2026-10-29T02:00:00Z"), "  Ana ")).toBe(
    "Boa noite, Ana",
  );
  expect(greeting(new Date("2026-10-29T12:00:00Z"), "")).toBe("Bom dia");
});

it("formats the long date in pt-BR for São Paulo", () => {
  expect(longDate(new Date("2026-10-29T12:00:00Z"))).toBe(
    "quinta-feira, 29 de outubro",
  );
  expect(longDate(new Date("2026-10-30T01:00:00Z"))).toBe(
    "quinta-feira, 29 de outubro",
  );
});
