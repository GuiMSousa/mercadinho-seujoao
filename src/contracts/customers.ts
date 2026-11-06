import { z } from "zod";
import { CUSTOMER_TRANSACTION_TYPES } from "./enums";
import { hasNoNul, MAX_INTEGER, NUL_MESSAGE } from "./inventory";
import { documentSchema, partyNameSchema, whatsappSchema } from "./suppliers";

const customerFields = {
  name: partyNameSchema,
  document: documentSchema,
  phone: whatsappSchema,
  // How much the customer may owe, in cents; 0 means no fiado.
  creditLimit: z
    .int("Informe o limite em centavos.")
    .min(0, "Informe o limite em centavos.")
    .max(MAX_INTEGER, "Valor acima do limite."),
  active: z.boolean("Informe se o cliente está ativo."),
};

export const createCustomerSchema = z.object({
  name: customerFields.name,
  document: customerFields.document.default(""),
  phone: customerFields.phone.default(""),
  creditLimit: customerFields.creditLimit.default(0),
  active: customerFields.active.default(true),
});

// Built from the fields without defaults, or an absent field would reset the stored value.
export const updateCustomerSchema = z
  .object(customerFields)
  .partial()
  .refine(
    (v) => Object.values(v).some((x) => x !== undefined),
    "Informe ao menos um campo para alterar.",
  );

export const customerRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  document: z.string(),
  phone: z.string(),
  creditLimit: z.int(),
  currentDebt: z.int(),
  active: z.boolean(),
});

export const customersPageSchema = z.object({
  customers: z.array(customerRowSchema),
  total: z.int(),
  page: z.int(),
  pageSize: z.int(),
});

// What the sale screen (any session) reads to pick the fiado customer: no document nor phone.
export const customerOptionSchema = customerRowSchema.pick({
  id: true,
  name: true,
  creditLimit: true,
  currentDebt: true,
});
export const customerOptionsSchema = z.object({
  customers: z.array(customerOptionSchema),
});

// A payment towards the debt (quitação, total or partial).
export const customerPaymentSchema = z.object({
  // Chosen by the client: repeating it after a lost response records the payment once.
  id: z.uuid("Identificador do pagamento inválido."),
  amount: z
    .int("Informe o valor em centavos.")
    .min(1, "Informe um valor maior que zero.")
    .max(MAX_INTEGER, "Valor acima do limite."),
  notes: z
    .string()
    .trim()
    .max(200, "Use até 200 caracteres.")
    .refine(hasNoNul, NUL_MESSAGE)
    .default(""),
});

export const customerTransactionSchema = z.object({
  id: z.uuid(),
  type: z.enum(CUSTOMER_TRANSACTION_TYPES),
  amount: z.int(),
  // The fiado sale's receipt number; null for a payment.
  saleNumber: z.int().nullable(),
  userName: z.string(),
  notes: z.string(),
  createdAt: z.iso.datetime(),
});

// The statement, newest first, with the customer's current debt.
export const customerStatementSchema = z.object({
  customer: customerRowSchema,
  transactions: z.array(customerTransactionSchema),
  total: z.int(),
  page: z.int(),
  pageSize: z.int(),
});

export const customerPaymentResultSchema = z.object({
  customer: customerRowSchema,
  transaction: customerTransactionSchema,
});

export type CreateCustomer = z.output<typeof createCustomerSchema>;
export type UpdateCustomer = z.output<typeof updateCustomerSchema>;
export type CustomerRow = z.infer<typeof customerRowSchema>;
export type CustomersPage = z.infer<typeof customersPageSchema>;
export type CustomerOption = z.infer<typeof customerOptionSchema>;
export type CustomerPayment = z.output<typeof customerPaymentSchema>;
export type CustomerTransaction = z.infer<typeof customerTransactionSchema>;
export type CustomerStatement = z.infer<typeof customerStatementSchema>;
export type CustomerPaymentResult = z.infer<typeof customerPaymentResultSchema>;
