import { expect, it } from "vitest";
import { formatDateTime } from "./format";

it("formats an ISO instant as dd/mm/yyyy hh:mm in São Paulo", () => {
  expect(formatDateTime("2026-10-29T12:05:00.000Z")).toBe("29/10/2026 09:05");
  expect(formatDateTime("2026-10-30T02:00:00.000Z")).toBe("29/10/2026 23:00");
});
