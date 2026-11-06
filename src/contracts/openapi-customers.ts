import {
  createCustomerSchema,
  customerOptionsSchema,
  customerPaymentResultSchema,
  customerPaymentSchema,
  customerRowSchema,
  customersPageSchema,
  customerStatementSchema,
  updateCustomerSchema,
} from "./customers";
import { body, error, formError, json, jsonSchema } from "./openapi-helpers";

export const customersSchemas = {
  CustomerRow: jsonSchema(customerRowSchema),
  CustomersPage: jsonSchema(customersPageSchema),
  CustomerOptions: jsonSchema(customerOptionsSchema),
  CreateCustomerRequest: jsonSchema(createCustomerSchema, "input"),
  UpdateCustomerRequest: jsonSchema(updateCustomerSchema, "input"),
  CustomerStatement: jsonSchema(customerStatementSchema),
  CustomerPaymentRequest: jsonSchema(customerPaymentSchema, "input"),
  CustomerPaymentResult: jsonSchema(customerPaymentResultSchema),
};

const denied = {
  "401": error("Sem sessão."),
  "403": error("Perfil sem permissão (CASHIER)."),
};
const deniedWrite = {
  "401": error("Sem sessão."),
  "403": error(
    "Perfil sem permissão (CASHIER) ou cabeçalho anti-CSRF ausente ou inválido.",
  ),
};
const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};
const pageParam = {
  name: "page",
  in: "query",
  required: false,
  description: "Começa em 1. Além do fim, responde a última página.",
  schema: { type: "integer", minimum: 1 },
};
const searchParam = {
  name: "search",
  in: "query",
  required: false,
  schema: { type: "string", maxLength: 120 },
};

/** Paths of customers and fiado: the register and payments are ADMIN only; the picker any session. */
export const customersPaths = {
  "/api/customers": {
    get: {
      summary: "Busca clientes ativos para o fiado do PDV",
      description:
        "Aberta a qualquer sessão. Até 8 clientes por nome; a busca procura no nome, no WhatsApp e no CPF/CNPJ, mas a resposta não traz documento nem telefone.",
      security: [{ session: [] }],
      parameters: [searchParam],
      responses: {
        "200": {
          description: "Clientes encontrados.",
          content: json("CustomerOptions"),
        },
        "400": error("Busca inválida."),
        "401": error("Sem sessão."),
      },
    },
  },
  "/api/admin/customers": {
    get: {
      summary: "Lista os clientes (somente ADMIN)",
      description:
        "Paginada por nome, 20 por página; a busca procura no nome, no WhatsApp e no CPF/CNPJ.",
      security: [{ session: [] }],
      parameters: [searchParam, pageParam],
      responses: {
        "200": {
          description: "Página de clientes.",
          content: json("CustomersPage"),
        },
        "400": error("Parâmetros de busca inválidos."),
        ...denied,
      },
    },
    post: {
      summary: "Cadastra um cliente com limite de crédito (somente ADMIN)",
      description:
        "CPF/CNPJ e WhatsApp são gravados só com dígitos. O limite é em centavos; zero não permite fiado.",
      security: [{ session: [], csrf: [] }],
      requestBody: body("CreateCustomerRequest"),
      responses: {
        "201": {
          description: "Cliente cadastrado.",
          content: json("CustomerRow"),
        },
        "400": error("Corpo inválido."),
        ...deniedWrite,
        "409": formError("CPF/CNPJ já usado (fields.document)."),
        "422": formError("Campos inválidos (fields)."),
      },
    },
  },
  "/api/admin/customers/{id}": {
    get: {
      summary: "Extrato do cliente (somente ADMIN)",
      description:
        "O cliente com o saldo devedor atual e uma página das compras no fiado e dos pagamentos, dos mais novos para os mais antigos, 20 por página.",
      security: [{ session: [] }],
      parameters: [idParam, pageParam],
      responses: {
        "200": {
          description: "Extrato.",
          content: json("CustomerStatement"),
        },
        "400": error("Parâmetros inválidos."),
        ...denied,
        "404": error("Cliente não encontrado."),
      },
    },
    patch: {
      summary: "Altera, muda o limite ou inativa um cliente (somente ADMIN)",
      description:
        "O limite pode ficar abaixo do saldo devedor: o cliente só não compra mais no fiado.",
      security: [{ session: [], csrf: [] }],
      parameters: [idParam],
      requestBody: body("UpdateCustomerRequest"),
      responses: {
        "200": {
          description: "Cliente alterado.",
          content: json("CustomerRow"),
        },
        "400": error("Corpo inválido."),
        ...deniedWrite,
        "404": error("Cliente não encontrado."),
        "409": formError("CPF/CNPJ já usado (fields.document)."),
        "422": formError("Campos inválidos (fields)."),
      },
    },
  },
  "/api/admin/customers/{id}/payments": {
    post: {
      summary:
        "Registra um pagamento do fiado, total ou parcial (somente ADMIN)",
      description:
        "Abate o valor do saldo devedor na mesma transação que grava o pagamento; nunca abaixo de zero. O id é gerado pelo cliente: repetir o mesmo pagamento devolve o já registrado. Não entra no caixa do PDV.",
      security: [{ session: [], csrf: [] }],
      parameters: [idParam],
      requestBody: body("CustomerPaymentRequest"),
      responses: {
        "201": {
          description: "Pagamento registrado, com o saldo devedor novo.",
          content: json("CustomerPaymentResult"),
        },
        "400": error("Corpo inválido."),
        ...deniedWrite,
        "404": error("Cliente não encontrado."),
        "409": error("Id já usado por outro pagamento."),
        "422": formError(
          "Campos inválidos ou valor acima do saldo devedor (fields.amount).",
        ),
      },
    },
  },
};
