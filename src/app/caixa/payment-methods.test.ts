import { expect, it } from "vitest";
import { PAYMENT_METHODS } from "@/contracts/enums";
import { METHODS, methodForKey } from "./payment-methods";

it("offers every payment method, each on its own key", () => {
  expect(METHODS.map((method) => method.value).sort()).toEqual(
    [...PAYMENT_METHODS].sort(),
  );
  const keys = METHODS.map((method) => method.key);
  expect(new Set(keys).size).toBe(keys.length);
  // Digits belong to the amount field.
  for (const key of keys) expect(key).toMatch(/^[A-Z]$/);
});

it("picks the method of a key in either case, and nothing for other keys", () => {
  expect(methodForKey("r")).toBe("MEAL_VOUCHER");
  expect(methodForKey("A")).toBe("FOOD_VOUCHER");
  expect(methodForKey("d")).toBe("CASH");
  for (const key of ["Enter", "1", "x", "Escape"])
    expect(methodForKey(key)).toBeUndefined();
});
