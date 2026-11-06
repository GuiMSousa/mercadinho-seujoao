import "server-only";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type {
  CreateCustomer,
  CustomerPayment,
  UpdateCustomer,
} from "@/contracts/customers";
import { containsPattern } from "@/domains/inventory/repository";
import { getDb, type Tx } from "@/infrastructure/db";
import {
  customers,
  customerTransactions,
  sales,
  users,
} from "@/infrastructure/db/schema";

/** The payment is more than the customer owes; nothing was recorded. */
export class PaymentAboveDebt extends Error {
  constructor() {
    super("Payment above the debt");
  }
}

const customerRow = {
  id: customers.id,
  name: customers.name,
  document: customers.document,
  phone: customers.phone,
  creditLimit: customers.creditLimit,
  currentDebt: customers.currentDebt,
  active: customers.active,
};

const matches = (search: string) => {
  const pattern = containsPattern(search);
  return search
    ? or(
        ilike(customers.name, pattern),
        ilike(customers.phone, pattern),
        ilike(customers.document, pattern),
      )
    : undefined;
};

export const countCustomers = (search: string) =>
  getDb().$count(customers, matches(search));

export function selectCustomersPage(
  search: string,
  page: { limit: number; offset: number },
) {
  return getDb()
    .select(customerRow)
    .from(customers)
    .where(matches(search))
    .orderBy(asc(customers.name), asc(customers.id))
    .limit(page.limit)
    .offset(page.offset);
}

/** Active customers matching `search`, by name, for the sale screen. */
export function selectCustomerOptions(search: string, limit: number) {
  return getDb()
    .select({
      id: customers.id,
      name: customers.name,
      creditLimit: customers.creditLimit,
      currentDebt: customers.currentDebt,
    })
    .from(customers)
    .where(and(eq(customers.active, true), matches(search)))
    .orderBy(asc(customers.name), asc(customers.id))
    .limit(limit);
}

export async function selectCustomer(id: string) {
  const [row] = await getDb()
    .select(customerRow)
    .from(customers)
    .where(eq(customers.id, id));
  return row as typeof row | undefined;
}

export async function insertCustomer(values: CreateCustomer) {
  const [row] = await getDb()
    .insert(customers)
    .values(values)
    .returning(customerRow);
  return row;
}

export async function updateCustomerRow(id: string, values: UpdateCustomer) {
  const [row] = await getDb()
    .update(customers)
    .set(values)
    .where(eq(customers.id, id))
    .returning(customerRow);
  return row as typeof row | undefined;
}

/**
 * Inside the sale's transaction: adds `amount` to an active customer's debt when it stays within the
 * limit, and records the DEBIT. One conditional UPDATE: concurrent sales queue on the row and each
 * sees the debt the previous one left. Undefined when it was refused (nothing written).
 */
export async function chargeCustomer(
  tx: Tx,
  charge: {
    customerId: string;
    saleId: string;
    amount: number;
    userId: string;
  },
) {
  const [row] = await tx
    .update(customers)
    .set({ currentDebt: sql`${customers.currentDebt} + ${charge.amount}` })
    .where(
      and(
        eq(customers.id, charge.customerId),
        eq(customers.active, true),
        // bigint: a debt near the integer limit plus the amount must not overflow before comparing.
        sql`${customers.currentDebt}::bigint + ${charge.amount} <= ${customers.creditLimit}`,
      ),
    )
    .returning(customerRow);
  if (!row) return undefined;
  await tx.insert(customerTransactions).values({
    customerId: charge.customerId,
    saleId: charge.saleId,
    type: "DEBIT",
    amount: charge.amount,
    userId: charge.userId,
  });
  return row;
}

const transactionRow = {
  id: customerTransactions.id,
  type: customerTransactions.type,
  amount: customerTransactions.amount,
  saleNumber: sales.number,
  userName: users.name,
  notes: customerTransactions.notes,
  createdAt: customerTransactions.createdAt,
};

const transactionsQuery = () =>
  getDb()
    .select(transactionRow)
    .from(customerTransactions)
    .innerJoin(users, eq(users.id, customerTransactions.userId))
    .leftJoin(sales, eq(sales.id, customerTransactions.saleId));

/**
 * Records a payment towards the debt and lowers it, both or neither. The debt only drops when it
 * covers the amount (one conditional UPDATE, so concurrent payments cannot take it below zero).
 * A repeated id answers the payment already recorded when it is the same one.
 */
export function insertPayment(
  customerId: string,
  userId: string,
  input: CustomerPayment,
) {
  return getDb().transaction(async (tx) => {
    const [inserted] = await tx
      .insert(customerTransactions)
      .values({ ...input, customerId, userId, type: "PAYMENT" })
      .onConflictDoNothing({ target: customerTransactions.id })
      .returning({ id: customerTransactions.id });
    if (!inserted) {
      const [existing] = await tx
        .select({
          customerId: customerTransactions.customerId,
          userId: customerTransactions.userId,
          type: customerTransactions.type,
          amount: customerTransactions.amount,
          notes: customerTransactions.notes,
        })
        .from(customerTransactions)
        .where(eq(customerTransactions.id, input.id));
      const same =
        existing?.customerId === customerId &&
        existing.userId === userId &&
        existing.type === "PAYMENT" &&
        existing.amount === input.amount &&
        existing.notes === input.notes;
      return same ? { kind: "replay" as const } : { kind: "conflict" as const };
    }
    const [customer] = await tx
      .update(customers)
      .set({ currentDebt: sql`${customers.currentDebt} - ${input.amount}` })
      .where(
        and(
          eq(customers.id, customerId),
          sql`${customers.currentDebt} >= ${input.amount}`,
        ),
      )
      .returning({ id: customers.id });
    // Thrown, so the inserted row rolls back with the refusal.
    if (!customer) throw new PaymentAboveDebt();
    return { kind: "recorded" as const };
  });
}

export async function selectTransaction(id: string) {
  const [row] = await transactionsQuery().where(
    eq(customerTransactions.id, id),
  );
  return row as typeof row | undefined;
}

export const countTransactions = (customerId: string) =>
  getDb().$count(
    customerTransactions,
    eq(customerTransactions.customerId, customerId),
  );

export function selectTransactionsPage(
  customerId: string,
  page: { limit: number; offset: number },
) {
  return transactionsQuery()
    .where(eq(customerTransactions.customerId, customerId))
    .orderBy(
      desc(customerTransactions.createdAt),
      desc(customerTransactions.id),
    )
    .limit(page.limit)
    .offset(page.offset);
}
