import { describe, expect, it } from "vitest";
import { passwordScore, STRENGTH_LABELS } from "./password-strength";

describe("passwordScore", () => {
  it("is 0 for an empty or short letters-only password", () => {
    expect(passwordScore("")).toBe(0);
    expect(passwordScore("abc")).toBe(0);
  });

  it("adds one point for 8 characters", () => {
    expect(passwordScore("abcdefgh")).toBe(1);
  });

  it("adds one point for letters and digits together", () => {
    expect(passwordScore("abc123")).toBe(1);
    expect(passwordScore("abcd1234")).toBe(2);
  });

  it("adds one point for a symbol or 12+ characters", () => {
    expect(passwordScore("abcd123!")).toBe(3);
    expect(passwordScore("abcdefgh1234")).toBe(3);
  });

  it("caps at 3 and has a label per score", () => {
    expect(passwordScore("Abcdefgh1234!!")).toBe(3);
    expect(STRENGTH_LABELS).toEqual(["", "Fraca", "Média", "Forte"]);
  });
});
