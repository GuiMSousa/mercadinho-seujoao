import { body, error, formError, json } from "./openapi-helpers";

const forbiddenCsrf = error("Cabeçalho anti-CSRF ausente ou inválido.");

/** Paths of the daily cash register. The counter routes never answer the expected amount. */
export const cashPaths = {
  "/api/cash/open": {
    post: {
      summary: "Abre o caixa com o troco inicial",
      description:
        "Aberta a qualquer sessão. Só um caixa fica aberto por vez na loja.",
      security: [{ session: [], csrf: [] }],
      requestBody: body("OpenCashRequest"),
      responses: {
        "201": {
          description: "Caixa aberto.",
          content: json("OpenCashSession"),
        },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": forbiddenCsrf,
        "409": formError("Já existe um caixa aberto."),
        "422": formError("Campos inválidos (fields)."),
      },
    },
  },
  "/api/cash/movements": {
    post: {
      summary: "Registra uma sangria (BLEED) ou um suprimento (SUPPLY)",
      description:
        "Aberta a qualquer sessão, no caixa aberto e com motivo obrigatório. O id é gerado pelo cliente: repetir o mesmo registro com o mesmo id devolve o já gravado.",
      security: [{ session: [], csrf: [] }],
      requestBody: body("CashMovementRequest"),
      responses: {
        "201": {
          description: "Movimentação registrada.",
          content: json("CashMovementRow"),
        },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": forbiddenCsrf,
        "409": formError("O id já é de outra movimentação."),
        "422": formError("Campos inválidos ou caixa fechado (fields.cash)."),
      },
    },
  },
  "/api/cash/close": {
    post: {
      summary: "Fecha o caixa com a contagem cega",
      description:
        "Aberta a qualquer sessão. Grava o valor contado, calcula o esperado (troco inicial + vendas em dinheiro + suprimentos − sangrias) e a quebra, mas responde só o que foi contado. Repetir com a mesma contagem devolve o mesmo fechamento.",
      security: [{ session: [], csrf: [] }],
      requestBody: body("CloseCashRequest"),
      responses: {
        "200": {
          description: "Caixa fechado.",
          content: json("ClosedCash"),
        },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": forbiddenCsrf,
        "409": formError(
          "O caixa já foi fechado com outra contagem ou não existe.",
        ),
        "422": formError("Campos inválidos (fields)."),
      },
    },
  },
  "/api/admin/cash-sessions": {
    get: {
      summary: "Histórico e conciliação dos caixas (somente ADMIN)",
      description:
        "Do mais recente ao mais antigo, 20 por página, com troco inicial, vendas em dinheiro, suprimentos, sangrias, esperado, contado, quebra e as movimentações. Num caixa aberto, o esperado é o de até agora.",
      security: [{ session: [] }],
      parameters: [
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
          description: "Página de caixas.",
          content: json("CashSessionsPage"),
        },
        "400": error("Página inválida."),
        "401": error("Sem sessão."),
        "403": error("Perfil sem permissão (CASHIER)."),
      },
    },
  },
};
