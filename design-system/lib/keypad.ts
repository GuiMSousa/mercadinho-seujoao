export const KEYPAD_KEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "00",
  "0",
  "del",
] as const;

export type KeypadKey = (typeof KEYPAD_KEYS)[number];

/** Next cents digit string after a key press; full input ignores digits, leading zeros drop. */
export function pressKey(value: string, key: KeypadKey, maxLength: number) {
  const next =
    key === "del" ? value.slice(0, -1) : (value + key).slice(0, maxLength);
  return next.replace(/^0+(?=\d)/, "");
}

/** Cents typed so far: "1234" → 1234 (R$ 12,34). */
export function keypadCents(value: string) {
  return value === "" ? 0 : Number(value);
}
