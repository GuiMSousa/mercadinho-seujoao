import { body, error, formError, json } from "./openapi-helpers";

/** Paths of the sale screen (PDV); open to any session, never with cost, CMV or margin. */
export const salesPaths = {
  "/api/products/search": {
    get: {
      summary: "Busca produtos ativos para a venda, por nome ou código",
      description:
        "Aberta a qualquer sessão. Até 12 produtos por nome. Nunca devolve custo, CMV ou margem.",
      security: [{ session: [] }],
      parameters: [
        {
          name: "q",
          in: "query",
          required: true,
          description:
            "Parte do nome ou do código de barras (2 a 120 caracteres).",
          schema: { type: "string", minLength: 2, maxLength: 120 },
        },
      ],
      responses: {
        "200": {
          description: "Produtos encontrados.",
          content: json("ProductSearchResponse"),
        },
        "400": error("Busca ausente, curta demais ou inválida."),
        "401": error("Sem sessão."),
      },
    },
  },
  "/api/sales": {
    post: {
      summary: "Registra uma venda e dá baixa no estoque por PVPS",
      description:
        "Aberta a qualquer sessão. Usa os preços atuais do catálogo e grava preço e custo de cada item. Tudo na mesma transação: sem estoque, com o próximo lote vencido ou com produto inativo, nada é gravado. O total enviado deve ser o que o operador viu; se um preço mudou, a venda é recusada (409 com fields.total). O id é gerado pelo cliente: repetir a mesma venda com o mesmo id devolve a já registrada. Em dinheiro, amountReceived é obrigatório e o troco sai dele; nas outras formas, o recebido é o total.",
      security: [{ session: [], csrf: [] }],
      requestBody: body("CreateSaleRequest"),
      responses: {
        "201": {
          description: "Venda registrada (ou a já registrada com o mesmo id).",
          content: json("SaleReceipt"),
        },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": error("Cabeçalho anti-CSRF ausente ou inválido."),
        "409": formError(
          "Estoque insuficiente, lote vencido, produto inativo, preço alterado (fields.total) ou id já usado por outra venda.",
        ),
        "422": formError(
          "Campos inválidos, valor recebido menor que o total (fields.amountReceived) ou total acima do limite.",
        ),
      },
    },
  },
};
