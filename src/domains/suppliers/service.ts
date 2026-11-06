import "server-only";
import type { ListQuery } from "@/contracts/inventory";
import type { CreateSupplier, UpdateSupplier } from "@/contracts/suppliers";
import { logActivity } from "@/domains/activity/service";
import { ServiceError } from "@/domains/auth/errors";
import { todayInStore } from "@/domains/inventory/semaphore";
import { addDays } from "@/domains/reports/period";
import { uniqueViolation } from "@/infrastructure/db/errors";
import { groupBySupplier } from "./replenishment";
import {
  countSuppliers,
  insertSupplier,
  selectReplenishmentRows,
  selectSupplier,
  selectSupplierOptions,
  selectSuppliersPage,
  updateSupplierRow,
} from "./repository";

type Actor = { id: string; name: string };

const SUPPLIERS_PER_PAGE = 20;
// Products expiring within this many days enter the replenishment list (the yellow band).
const EXPIRY_HORIZON_DAYS = 30;

const FIELD_LABELS: Record<keyof UpdateSupplier, string> = {
  name: "nome",
  document: "CNPJ/CPF",
  phone: "WhatsApp",
  email: "e-mail",
  contactPerson: "contato",
  active: "situação",
};

function documentTaken(error: unknown) {
  if (uniqueViolation(error) !== "suppliers_cnpj_cpf_unique") return error;
  const message = "Já existe um fornecedor com esse CNPJ/CPF.";
  return new ServiceError(409, message, { fields: { document: message } });
}

/** A page past the end (the list shrank meanwhile) answers the last page, not an empty one. */
export async function listSuppliers({ search, page }: ListQuery) {
  const total = await countSuppliers(search);
  const current = Math.min(
    page,
    Math.max(1, Math.ceil(total / SUPPLIERS_PER_PAGE)),
  );
  const rows = await selectSuppliersPage(search, {
    limit: SUPPLIERS_PER_PAGE,
    offset: (current - 1) * SUPPLIERS_PER_PAGE,
  });
  return {
    suppliers: rows,
    total,
    page: current,
    pageSize: SUPPLIERS_PER_PAGE,
  };
}

export const listSupplierOptions = selectSupplierOptions;

export async function createSupplier(actor: Actor, input: CreateSupplier) {
  const supplier = await insertSupplier(input).catch((error: unknown) => {
    throw documentTaken(error);
  });
  await logActivity({
    user: actor,
    action: "Fornecedor cadastrado",
    detail: supplier.name,
  });
  return supplier;
}

export async function updateSupplier(
  actor: Actor,
  id: string,
  input: UpdateSupplier,
) {
  const supplier = await updateSupplierRow(id, input).catch(
    (error: unknown) => {
      throw documentTaken(error);
    },
  );
  if (!supplier) throw new ServiceError(404, "Fornecedor não encontrado.");
  await logActivity({
    user: actor,
    action: "Fornecedor alterado",
    detail: `${supplier.name}: ${Object.keys(input)
      .map((field) => FIELD_LABELS[field as keyof UpdateSupplier])
      .join(", ")}`,
  });
  return supplier;
}

/** A product's default supplier must exist; an inactive one cannot be chosen anew. */
export async function requireActiveSupplier(id: string) {
  const supplier = await selectSupplier(id);
  if (supplier?.active) return;
  const message = supplier
    ? "Esse fornecedor está inativo."
    : "Fornecedor não encontrado.";
  throw new ServiceError(422, message, {
    fields: { defaultSupplierId: message },
  });
}

/**
 * What to buy: active products at or below their minimum, or with stock expiring within 30 days
 * (expired included), each with (2 × minimum) − stock, grouped by default supplier.
 */
export async function getReplenishment(today = todayInStore()) {
  const rows = await selectReplenishmentRows(
    addDays(today, EXPIRY_HORIZON_DAYS),
  );
  return {
    groups: groupBySupplier(rows, today),
  };
}
