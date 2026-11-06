import { z } from "zod";

export const healthSchema = z.object({
  status: z.enum(["ok", "error"]),
  timestamp: z.iso.datetime(),
  db: z.enum(["connected", "disconnected"]),
});
