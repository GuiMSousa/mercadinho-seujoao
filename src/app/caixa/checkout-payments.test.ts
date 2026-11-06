import { expect, it } from "vitest";
import { settlePayments } from "@/contracts/sales";
import { addPayment, discountCents, nextStep } from "./checkout-payments";

it("works out the discount in cents from an amount or a percentage", () => {
  expect(discountCents(5547, null)).toBe(0);
  expect(discountCents(5547, { kind: "amount", value: 547 })).toBe(547);
  // 10% of R$ 55,47 = R$ 5,547 → R$ 5,55; 100% is the whole sale.
  expect(discountCents(5547, { kind: "percent", value: 1000 })).toBe(555);
  expect(discountCents(5547, { kind: "percent", value: 10000 })).toBe(5547);
});

it("keeps one line per method, summing what is added again", () => {
  const lines = addPayment(addPayment([], "PIX", 1000), "CASH", 500);
  expect(addPayment(lines, "PIX", 500)).toEqual([
    { method: "PIX", amount: 1500 },
    { method: "CASH", amount: 500 },
  ]);
});

it("adds lines until the total is covered, then finishes; only cash may pass it", () => {
  // R$ 50,00: R$ 20,00 by Pix first, then R$ 50,00 handed in cash (R$ 20,00 of change).
  const first = nextStep(5000, [], "PIX", 2000);
  expect(first).toEqual({
    kind: "add",
    lines: [{ method: "PIX", amount: 2000 }],
  });
  if (first.kind !== "add") return;
  expect(nextStep(5000, first.lines, "CASH", 5000)).toEqual({
    kind: "finish",
    payments: [
      { method: "PIX", amount: 2000 },
      { method: "CASH", amount: 5000 },
    ],
  });
  // A card cannot pay more than what is left.
  expect(nextStep(5000, first.lines, "DEBIT", 3500)).toMatchObject({
    kind: "refuse",
  });
  // Nothing typed and nothing left: finishes with what is there, even a sale of R$ 0,00.
  expect(nextStep(0, [], "CASH", 0)).toEqual({ kind: "finish", payments: [] });
  expect(nextStep(5000, [], "PIX", 0)).toMatchObject({ kind: "refuse" });
});

it("settles the payments as the server does: the change comes out of the cash", () => {
  expect(
    settlePayments(5000, [
      { method: "CASH", amount: 2500 },
      { method: "PIX", amount: 1500 },
      { method: "ON_ACCOUNT", amount: 1500 },
    ]),
  ).toEqual({
    ok: true,
    received: 5500,
    change: 500,
    payments: [
      { method: "CASH", amount: 2000 },
      { method: "PIX", amount: 1500 },
      { method: "ON_ACCOUNT", amount: 1500 },
    ],
  });
  expect(settlePayments(5000, [{ method: "PIX", amount: 4999 }])).toMatchObject(
    { ok: false },
  );
  // The change cannot swallow the whole cash share.
  expect(
    settlePayments(5000, [
      { method: "PIX", amount: 5000 },
      { method: "CASH", amount: 1000 },
    ]),
  ).toMatchObject({ ok: false });
});
