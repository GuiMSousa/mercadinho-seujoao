import { body, error, formError, json } from "./openapi-helpers";

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

/** Paths of suppliers and replenishment; ADMIN only. */
export const suppliersPaths = {
  "/api/admin/suppliers": {
    get: {
      summary: "Lista os fornecedores (somente ADMIN)",
      description:
        "Paginada por nome, 20 por página; a busca procura no nome, no contato e no CNPJ/CPF.",
      security: [{ session: [] }],
      parameters: [
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string", maxLength: 120 },
        },
        {
          name: "page",
          in: "query",
          required: false,
          description: "Começa em 1. Além do fim, responde a última página.",
          schema: { type: "integer", minimum: 1 },
        },
      ],
      responses: {
        "200": {
          description: "Página de fornecedores.",
          content: json("SuppliersPage"),
        },
        "400": error("Parâmetros de busca inválidos."),
        ...denied,
      },
    },
    post: {
      summary: "Cadastra um fornecedor (somente ADMIN)",
      description:
        "CNPJ/CPF e WhatsApp são gravados só com dígitos; o WhatsApp leva DDD e número, com ou sem o 55.",
      security: [{ session: [], csrf: [] }],
      requestBody: body("CreateSupplierRequest"),
      responses: {
        "201": {
          description: "Fornecedor cadastrado.",
          content: json("SupplierRow"),
        },
        "400": error("Corpo inválido."),
        ...deniedWrite,
        "409": formError("CNPJ/CPF já usado (fields.document)."),
        "422": formError("Campos inválidos (fields)."),
      },
    },
  },
  "/api/admin/suppliers/{id}": {
    patch: {
      summary: "Altera ou inativa um fornecedor (somente ADMIN)",
      security: [{ session: [], csrf: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: body("UpdateSupplierRequest"),
      responses: {
        "200": {
          description: "Fornecedor alterado.",
          content: json("SupplierRow"),
        },
        "400": error("Corpo inválido."),
        ...deniedWrite,
        "404": error("Fornecedor não encontrado."),
        "409": formError("CNPJ/CPF já usado (fields.document)."),
        "422": formError("Campos inválidos (fields)."),
      },
    },
  },
  "/api/admin/inventory/replenishment": {
    get: {
      summary: "Sugestão de reposição por fornecedor (somente ADMIN)",
      description:
        "Produtos ativos com estoque igual ou abaixo do mínimo, ou com lote em estoque vencido ou vencendo em até 30 dias (fuso da loja). Sugestão = 2 × mínimo − estoque, nunca abaixo de zero, na unidade-base (unidades, gramas ou mililitros). Agrupados pelo fornecedor padrão ativo; os demais ficam no grupo sem fornecedor (supplier null).",
      security: [{ session: [] }],
      responses: {
        "200": {
          description: "Grupos de reposição.",
          content: json("Replenishment"),
        },
        ...denied,
      },
    },
  },
};
