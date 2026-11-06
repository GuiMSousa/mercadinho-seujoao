import "server-only";
import type {
  CreateCustomer,
  CustomerPayment,
  UpdateCustomer,
} from "@/contracts/customers";
import type { ListQuery } from "@/contracts/inventory";
import { logActivity } from "@/domains/activity/service";
import { ServiceError } from "@/domains/auth/errors";
import { uniqueViolation } from "@/infrastructure/db/errors";
import { formatBrl } from "@ds/lib/money";
import {
  countCustomers,
  countTransactions,
  insertCustomer,
  insertPayment,
  PaymentAboveDebt,
  selectCustomer,
  selectCustomerOptions,
  selectCustomersPage,
  selectTransaction,
  selectTransactionsPage,
  updateCustomerRow,
} from "./repository";

type Actor = { id: string; name: string };

const PER_PAGE = 20;
const OPTIONS_LIMIT = 8;

const FIELD_LABELS: Record<keyof UpdateCustomer, string> = {
  name: "nome",
  document: "CPF/CNPJ",
  phone: "WhatsApp",
  creditLimit: "limite de crédito",
  active: "situação",
};

const notFound = () => new ServiceError(404, "Cliente não encontrado.");

function documentTaken(error: unknown) {
  if (uniqueViolation(error) !== "customers_cpf_cnpj_unique") return error;
  const message = "Já existe um cliente com esse CPF/CNPJ.";
  return new ServiceError(409, message, { fields: { document: message } });
}

/** A page past the end (the list shrank meanwhile) answers the last page, not an empty one. */
const lastPage = (page: number, total: number) =>
  Math.min(page, Math.max(1, Math.ceil(total / PER_PAGE)));

export async function listCustomers({ search, page }: ListQuery) {
  const total = await countCustomers(search);
  const current = lastPage(page, total);
  const rows = await selectCustomersPage(search, {
    limit: PER_PAGE,
    offset: (current - 1) * PER_PAGE,
  });
  return { customers: rows, total, page: current, pageSize: PER_PAGE };
}

/** Active customers for the sale screen's fiado picker. */
export const findCustomerOptions = async (search: string) => ({
  customers: await selectCustomerOptions(search, OPTIONS_LIMIT),
});

export async function createCustomer(actor: Actor, input: CreateCustomer) {
  const customer = await insertCustomer(input).catch((error: unknown) => {
    throw documentTaken(error);
  });
  await logActivity({
    user: actor,
    action: "Cliente cadastrado",
    detail: customer.name,
  });
  return customer;
}

export async function updateCustomer(
  actor: Actor,
  id: string,
  input: UpdateCustomer,
) {
  const customer = await updateCustomerRow(id, input).catch(
    (error: unknown) => {
      throw documentTaken(error);
    },
  );
  if (!customer) throw notFound();
  await logActivity({
    user: actor,
    action: "Cliente alterado",
    detail: `${customer.name}: ${Object.keys(input)
      .map((field) => FIELD_LABELS[field as keyof UpdateCustomer])
      .join(", ")}`,
  });
  return customer;
}

/** The customer with one page of the statement, newest first. */
export async function getStatement(id: string, page: number) {
  const customer = await selectCustomer(id);
  if (!customer) throw notFound();
  const total = await countTransactions(id);
  const current = lastPage(page, total);
  const rows = await selectTransactionsPage(id, {
    limit: PER_PAGE,
    offset: (current - 1) * PER_PAGE,
  });
  return {
    customer,
    transactions: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page: current,
    pageSize: PER_PAGE,
  };
}

/**
 * Records a payment towards the debt (quitação, total or partial) and lowers it atomically.
 * It never goes into the PDV drawer: money put there is a suprimento.
 */
export async function receivePayment(
  actor: Actor,
  customerId: string,
  input: CustomerPayment,
) {
  const customer = await selectCustomer(customerId);
  if (!customer) throw notFound();
  const result = await insertPayment(customerId, actor.id, input).catch(
    async (error: unknown) => {
      if (!(error instanceof PaymentAboveDebt)) throw error;
      // Read again: another payment may have lowered the debt meanwhile.
      const debt = (await selectCustomer(customerId))?.currentDebt ?? 0;
      const message =
        debt === 0
          ? `${customer.name} não tem saldo devedor.`
          : `O valor passa do saldo devedor de ${formatBrl(debt)}.`;
      throw new ServiceError(422, message, { fields: { amount: message } });
    },
  );
  if (result.kind === "conflict")
    throw new ServiceError(
      409,
      "Este pagamento já foi registrado com outros dados. Abra o recebimento de novo.",
    );
  if (result.kind === "recorded")
    await logActivity({
      user: actor,
      action: "Fiado recebido",
      detail: `${customer.name}: ${formatBrl(input.amount)}`,
    });
  const [updated, transaction] = await Promise.all([
    selectCustomer(customerId),
    selectTransaction(input.id),
  ]);
  if (!updated || !transaction)
    throw new Error(`Payment ${input.id} was not recorded`);
  return {
    customer: updated,
    transaction: {
      ...transaction,
      createdAt: transaction.createdAt.toISOString(),
    },
  };
}
