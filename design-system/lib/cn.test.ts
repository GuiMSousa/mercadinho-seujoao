import { expect, it } from "vitest";
import { cn } from "./cn";

it("keeps a design-system font size next to a text color", () => {
  expect(cn("text-body-lg text-strong")).toBe("text-body-lg text-strong");
});

it("lets a later class override the design-system scales", () => {
  expect(cn("text-body-md", "text-counter")).toBe("text-counter");
  expect(cn("rounded-control", "rounded-card")).toBe("rounded-card");
  expect(cn("h-control-md", "h-control-lg")).toBe("h-control-lg");
});
