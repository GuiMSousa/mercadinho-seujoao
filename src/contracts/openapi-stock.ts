import { body, error, formError, json, jsonSchema } from "./openapi-helpers";
import {
  productImportResultSchema,
  productImportSchema,
} from "./product-import";
import { movementsPageSchema } from "./stock-history";
import { stockAlertsSchema } from "./suppliers";

export const stockSchemas = {
  MovementsPage: jsonSchema(movementsPageSchema),
  StockAlerts: jsonSchema(stockAlertsSchema),
  ProductImportRequest: jsonSchema(productImportSchema, "input"),
  ProductImportResult: jsonSchema(productImportResultSchema),
};

const denied = {
  "401": error("Sem sessão."),
  "403": error("Perfil sem permissão (CASHIER)."),
};
const query = (name: string, description: string, format?: string) => ({
  name,
  in: "query",
  required: false,
  description,
  schema: { type: "string", ...(format && { format }) },
});

/** Stock history, header alerts and product import; ADMIN only. */
export const stockPaths = {
  "/api/admin/inventory/movements": {
    get: {
      summary: "Histórico de movimentações de estoque (somente ADMIN)",
      description:
        "Entradas de lote (IN), saídas por venda PVPS ou baixa manual (OUT) e ajustes (ADJUSTMENT), das mais novas para as mais antigas, 20 por página. Os dias são os do fuso da loja.",
      security: [{ session: [] }],
      parameters: [
        query("search", "Parte do nome ou do código de barras do produto."),
        query("type", "IN, OUT ou ADJUSTMENT; vazio para todos."),
        query("from", "Primeiro dia (AAAA-MM-DD).", "date"),
        query("to", "Último dia (AAAA-MM-DD), não antes de from.", "date"),
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1 },
        },
      ],
      responses: {
        "200": {
          description: "Página de movimentações.",
          content: json("MovementsPage"),
        },
        "400": error("Filtros inválidos (período invertido, data ou tipo)."),
        ...denied,
      },
    },
  },
  "/api/admin/inventory/alerts": {
    get: {
      summary: "Produtos que precisam de atenção (somente ADMIN)",
      description:
        "Quantos produtos ativos estão sem estoque, no mínimo ou abaixo, ou com lote em estoque vencido ou vencendo em até 7 dias. É o número do sino no cabeçalho do painel.",
      security: [{ session: [] }],
      responses: {
        "200": { description: "Contagem.", content: json("StockAlerts") },
        ...denied,
      },
    },
  },
  "/api/admin/products/import": {
    post: {
      summary: "Importa produtos de uma planilha CSV (somente ADMIN)",
      description:
        "Colunas nome, codigo_barras, categoria, preco_custo, preco_venda, unidade (UN, KG ou L) e estoque_minimo; separador ; ou ,; até 5.000 linhas. Código existente atualiza o produto; os outros são criados, e categorias que faltam também. Tudo ou nada: com qualquer linha inválida, nada é gravado e fields traz o problema de cada linha, pela linha do arquivo.",
      security: [{ session: [], csrf: [] }],
      requestBody: body("ProductImportRequest"),
      responses: {
        "200": {
          description: "Importação concluída.",
          content: json("ProductImportResult"),
        },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": error(
          "Perfil sem permissão (CASHIER) ou cabeçalho anti-CSRF ausente ou inválido.",
        ),
        "409": error("Um código de barras foi cadastrado ao mesmo tempo."),
        "422": formError(
          "Arquivo inválido; fields traz cada linha com problema (chave = número da linha).",
        ),
      },
    },
  },
};
