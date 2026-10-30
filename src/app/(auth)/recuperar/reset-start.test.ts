import { expect, it } from "vitest";
import { resetStart } from "./reset-start";

it("opens the code step, prefilled, for a valid e-mail with etapa=codigo", () => {
  expect(resetStart({ email: " ana@loja.com ", etapa: "codigo" })).toEqual({
    email: "ana@loja.com",
    step: 2,
  });
});

it("stays on step 1 without etapa, keeping a valid e-mail prefilled", () => {
  expect(resetStart({ email: "ana@loja.com" })).toEqual({
    email: "ana@loja.com",
    step: 1,
  });
  expect(resetStart({})).toEqual({ email: "", step: 1 });
});

it("ignores an invalid e-mail and unknown steps", () => {
  expect(resetStart({ email: "nope", etapa: "codigo" })).toEqual({
    email: "",
    step: 1,
  });
  expect(resetStart({ email: "ana@loja.com", etapa: "x" }).step).toBe(1);
  expect(resetStart({ email: ["a@b.co", "c"], etapa: ["codigo"] })).toEqual({
    email: "a@b.co",
    step: 2,
  });
});
