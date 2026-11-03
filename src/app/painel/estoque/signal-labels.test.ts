import { expect, it } from "vitest";
import { expiryLabel, formatDate } from "./signal-labels";

it("names the expiry in plain words", () => {
  expect(expiryLabel(null)).toBe("Não vence");
  expect(expiryLabel(-3)).toBe("Vencido");
  expect(expiryLabel(0)).toBe("Vence hoje");
  expect(expiryLabel(1)).toBe("Vence amanhã");
  expect(expiryLabel(12)).toBe("Vence em 12 dias");
});

it("shows a calendar date as dd/mm/aaaa", () => {
  expect(formatDate("2026-12-01")).toBe("01/12/2026");
});
