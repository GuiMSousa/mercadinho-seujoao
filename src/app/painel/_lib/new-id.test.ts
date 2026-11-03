import { expect, it } from "vitest";
import { z } from "zod";
import { newId } from "./new-id";

it("makes ids the batch contract accepts, and no two alike", () => {
  const ids = Array.from({ length: 50 }, newId);
  for (const id of ids) expect(z.uuid().safeParse(id).success).toBe(true);
  expect(new Set(ids).size).toBe(50);
});
