import { z } from "zod";
import { ServiceError } from "@/domains/auth/errors";

export type CustomerContext = { params: Promise<{ id: string }> };

/** A malformed id can match no customer; checking here keeps Postgres from failing with a 500. */
export async function customerId({ params }: CustomerContext) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) throw new ServiceError(404, "Cliente não encontrado.");
  return id.data;
}
