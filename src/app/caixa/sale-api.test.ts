import { beforeEach, expect, it, vi } from "vitest";
import { apiFetch } from "@/app/painel/_lib/api";
import { parseScaleLabel } from "@/lib/barcode-scale";
import { lookupScaleLabel } from "./sale-api";

vi.mock("@/app/painel/_lib/api", () => ({ apiFetch: vi.fn() }));
const fetchMock = vi.mocked(apiFetch);

const picanha = {
  id: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b03",
  barcode: "00123",
  name: "Picanha",
  sellPrice: 8000,
  unit: "KG" as const,
  stock: 5000,
  expired: false,
};
const found = (product: typeof picanha | Record<string, unknown>) =>
  fetchMock.mockResolvedValue({ ok: true, data: product } as never);

// 1,500 kg and R$ 23,47 labels for the product code 00123.
const byWeight = parseScaleLabel("2100123015009")!;
const byPrice = parseScaleLabel("2000123023472")!;

beforeEach(() => fetchMock.mockReset());

it("finds the weighed product by the label's 5-digit code and sells the label's weight", async () => {
  found(picanha);
  await expect(lookupScaleLabel(byWeight)).resolves.toEqual({
    product: picanha,
    grams: 1500,
  });
  expect(fetchMock).toHaveBeenCalledWith("/api/products?barcode=00123");
  found(picanha);
  await expect(lookupScaleLabel(byPrice)).resolves.toMatchObject({
    grams: 293,
  });
});

it("refuses a label whose code is not a product sold by the kilo", async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    status: 404,
    errors: { error: "Produto não encontrado." },
  } as never);
  await expect(lookupScaleLabel(byWeight)).resolves.toMatchObject({
    title: "Produto da etiqueta não encontrado",
    message: expect.stringContaining("00123"),
  });

  found({ ...picanha, unit: "UN", sellPrice: 1849 });
  await expect(lookupScaleLabel(byWeight)).resolves.toMatchObject({
    title: "Etiqueta de balança",
  });

  // Free in the catalog: a price label cannot say how much was weighed.
  found({ ...picanha, sellPrice: 0 });
  await expect(lookupScaleLabel(byPrice)).resolves.toMatchObject({
    title: "Etiqueta sem peso",
  });
});
