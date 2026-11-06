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
        "Aberta a qualquer sessão. Usa os preços atuais do catálogo e grava preço e custo de cada item. Tudo na mesma transação: sem estoque, com o próximo lote vencido ou com produto inativo, nada é gravado. O total enviado deve ser o que o operador viu; se um preço mudou, a venda é recusada (409 com fields.total). O id é gerado pelo cliente: repetir a mesma venda com o mesmo id devolve a já registrada. Cada item pode ter seu desconto (centavos, até o valor do item); o desconto da venda (centavos) sai da soma dos itens já descontados e não pode passar dela; total = itens − desconto. Um operador (CASHIER) dá no máximo 5% do valor dos itens antes de qualquer desconto, somando itens e venda; um ADMIN, até tudo (acima disso, 422 com fields.discount). Vale-refeição (MEAL_VOUCHER) e vale-alimentação (FOOD_VOUCHER), como cartões, pagam a sua parte exata. payments traz o que foi entregue em cada forma, uma linha por forma; a soma deve cobrir o total, e só o dinheiro pode passar da sua parte (o excesso é o troco). Com total zero, payments vem vazio. Fiado (ON_ACCOUNT) exige customerId, e customerId só vale com fiado: o saldo devedor do cliente sobe na mesma transação, e a venda é recusada se ele estiver inativo ou se saldo + fiado passar do limite (422 com fields.customerId).",
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
          'Caixa fechado (fields.cash: "Não é possível realizar vendas com o caixa fechado."), campos inválidos, desconto acima dos itens (fields.discount), pagamentos que não fecham o total (fields.payments), fiado recusado (fields.customerId) ou total acima do limite.',
        ),
      },
    },
  },
};
