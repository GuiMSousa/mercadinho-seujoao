import { z } from "zod";

// The file as text: the screen reads it (UTF-8, or Windows-1252 from older Excel) and sends it.
export const productImportSchema = z.object({
  csv: z
    .string("Envie o arquivo CSV.")
    .min(1, "Envie o arquivo CSV.")
    .max(2_000_000, "Arquivo grande demais: use até 2 MB."),
});

export const productImportResultSchema = z.object({
  inserted: z.int(),
  updated: z.int(),
  categoriesCreated: z.int(),
});

export type ProductImportResult = z.infer<typeof productImportResultSchema>;
