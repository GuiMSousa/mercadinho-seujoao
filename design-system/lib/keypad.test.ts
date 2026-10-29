import { expect, it } from "vitest";
import { keypadCents, pressKey } from "./keypad";

it("builds a cents string digit by digit and deletes from the end", () => {
  let value = "";
  for (const key of ["1", "2", "00"] as const) value = pressKey(value, key, 9);
  expect(value).toBe("1200");
  expect(keypadCents(value)).toBe(1200);
  expect(pressKey(value, "del", 9)).toBe("120");
  expect(pressKey("", "del", 9)).toBe("");
});

it("drops leading zeros and ignores digits past the maximum length", () => {
  expect(pressKey("", "00", 9)).toBe("0");
  expect(pressKey("0", "5", 9)).toBe("5");
  expect(pressKey("123456789", "1", 9)).toBe("123456789");
  expect(pressKey("12345678", "00", 9)).toBe("123456780");
  expect(keypadCents("")).toBe(0);
});
