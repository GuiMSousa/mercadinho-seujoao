import { body, error, formError, json } from "./openapi-helpers";

const forbidden = error(
  "Perfil sem permissão (CASHIER) ou cabeçalho anti-CSRF ausente ou inválido.",
);
const listParameters = [
  {
    name: "search",
    in: "query",
    required: false,
    description: "Parte do nome ou do código de barras.",
    schema: { type: "string", maxLength: 120 },
  },
  {
    name: "page",
    in: "query",
    required: false,
    description: "Começa em 1. Além do fim, responde a última página.",
    schema: { type: "integer", minimum: 1 },
  },
];
const productIdParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

/** Paths of the catalog and stock routes. Quantities are integers: units, grams or milliliters. */
export const inventoryPaths = {
  "/api/admin/categories": {
    get: {
      summary: "Lista as categorias (somente ADMIN)",
      security: [{ session: [] }],
      responses: {
        "200": {
          description: "Categorias por nome.",
          content: json("CategoriesListResponse"),
        },
        "401": error("Sem sessão."),
        "403": error("Perfil sem permissão (CASHIER)."),
      },
    },
    post: {
      summary: "Cria uma categoria (somente ADMIN)",
      security: [{ session: [], csrf: [] }],
      requestBody: body("CreateCategoryRequest"),
      responses: {
        "201": {
          description: "Categoria criada.",
          content: json("CategoryRow"),
        },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": forbidden,
        "409": formError("Nome já usado (fields.name)."),
        "422": formError("Campos inválidos (fields)."),
      },
    },
  },
  "/api/admin/products": {
    get: {
      summary: "Lista os produtos com custo e estoque (somente ADMIN)",
      description: "Paginada e ordenada por nome, com 20 produtos por página.",
      security: [{ session: [] }],
      parameters: listParameters,
      responses: {
        "200": {
          description: "Página de produtos.",
          content: json("ProductsPage"),
        },
        "400": error("Parâmetros de busca inválidos."),
        "401": error("Sem sessão."),
        "403": error("Perfil sem permissão (CASHIER)."),
      },
    },
    post: {
      summary: "Cadastra um produto (somente ADMIN)",
      description: "Preços em centavos inteiros.",
      security: [{ session: [], csrf: [] }],
      requestBody: body("CreateProductRequest"),
      responses: {
        "201": { description: "Produto criado.", content: json("ProductRow") },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": forbidden,
        "409": formError("Código de barras já usado (fields.barcode)."),
        "422": formError(
          "Campos inválidos ou categoria inexistente (fields.categoryId).",
        ),
      },
    },
  },
  "/api/admin/products/{id}": {
    patch: {
      summary: "Altera um produto (somente ADMIN)",
      security: [{ session: [], csrf: [] }],
      parameters: [productIdParameter],
      requestBody: body("UpdateProductRequest"),
      responses: {
        "200": {
          description: "Produto alterado.",
          content: json("ProductRow"),
        },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": forbidden,
        "404": error("Produto não encontrado."),
        "409": formError(
          "Código de barras já usado (fields.barcode) ou troca de unidade depois do primeiro lote (fields.unit).",
        ),
        "422": formError(
          "Campos inválidos ou categoria inexistente (fields.categoryId).",
        ),
      },
    },
  },
  "/api/admin/products/{id}/batches": {
    post: {
      summary: "Registra a entrada de um lote (somente ADMIN)",
      description:
        "Cria o lote e a movimentação IN na mesma transação. O id é opcional e gerado pelo cliente: repetir a mesma entrada com o mesmo id devolve o lote já criado, sem somar estoque. O mesmo código de lote pode entrar mais de uma vez. Validade null indica item que não vence.",
      security: [{ session: [], csrf: [] }],
      parameters: [productIdParameter],
      requestBody: body("CreateBatchRequest"),
      responses: {
        "201": { description: "Lote criado.", content: json("BatchRow") },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": forbidden,
        "404": error("Produto não encontrado."),
        "409": formError(
          "O id já é de uma entrada com outros dados ou de outro produto.",
        ),
        "422": formError("Campos inválidos (fields)."),
      },
    },
  },
  "/api/admin/inventory": {
    get: {
      summary: "Lista os lotes por produto, com o semáforo (somente ADMIN)",
      description:
        "Paginada por produto, com 10 por página. Só lista lotes com saldo, e deixa de fora produtos inativos sem saldo. Lote: vermelho se vencido ou se vence em até 7 dias, amarelo de 8 a 30 dias, verde depois disso ou sem validade. Produto: o pior entre os lotes e o estoque (vermelho se zerado, amarelo no mínimo ou abaixo).",
      security: [{ session: [] }],
      parameters: listParameters,
      responses: {
        "200": {
          description: "Página de produtos com lotes.",
          content: json("InventoryPage"),
        },
        "400": error("Parâmetros de busca inválidos."),
        "401": error("Sem sessão."),
        "403": error("Perfil sem permissão (CASHIER)."),
      },
    },
  },
  "/api/admin/inventory/out": {
    post: {
      summary: "Dá baixa no estoque por PVPS (somente ADMIN)",
      description:
        "Consome primeiro o lote de validade mais próxima, passando aos seguintes quando preciso (lotes sem validade por último), com uma movimentação OUT por lote. Sem estoque suficiente, nada é alterado.",
      security: [{ session: [], csrf: [] }],
      requestBody: body("ConsumeStockRequest"),
      responses: {
        "200": {
          description: "Quanto saiu de cada lote.",
          content: json("ConsumeStockResponse"),
        },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": forbidden,
        "404": error("Produto não encontrado."),
        "409": formError("Estoque insuficiente."),
        "422": formError("Campos inválidos (fields)."),
      },
    },
  },
  "/api/products": {
    get: {
      summary: "Busca um produto ativo pelo código de barras",
      description:
        "Aberta a qualquer sessão. Nunca devolve custo, CMV ou margem.",
      security: [{ session: [] }],
      parameters: [
        {
          name: "barcode",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Produto para a venda.",
          content: json("ProductLookup"),
        },
        "400": error("Código de barras ausente ou inválido."),
        "401": error("Sem sessão."),
        "404": error("Produto não encontrado ou inativo."),
      },
    },
  },
};
