import { error, json, tooMany } from "./openapi-helpers";

const periodParameters = [
  {
    name: "period",
    in: "query",
    required: false,
    description:
      "today (padrão), 7d (hoje e os 6 dias antes), 30d, month (do dia 1 até hoje) ou custom (com from e to). Dias no fuso da loja (America/Sao_Paulo).",
    schema: {
      type: "string",
      enum: ["today", "7d", "30d", "month", "custom"],
    },
  },
  {
    name: "from",
    in: "query",
    required: false,
    description: "Data inicial (AAAA-MM-DD), obrigatória em custom.",
    schema: { type: "string", format: "date" },
  },
  {
    name: "to",
    in: "query",
    required: false,
    description:
      "Data final (AAAA-MM-DD), inclusiva, obrigatória em custom; até 366 dias depois da inicial.",
    schema: { type: "string", format: "date" },
  },
];
const denied = {
  "401": error("Sem sessão."),
  "403": error("Perfil sem permissão (CASHIER)."),
};

/** Paths of the financial reports; ADMIN only, because they carry CMV and margins. */
export const reportsPaths = {
  "/api/admin/reports": {
    get: {
      summary: "Relatório financeiro do período (somente ADMIN)",
      description:
        "Faturamento bruto, CMV gravado na venda, lucro bruto, margem bruta (%), ticket médio, quantidade de vendas e de itens, totais por forma de pagamento e os 5 produtos com mais quantidade, faturamento e lucro.",
      security: [{ session: [] }],
      parameters: periodParameters,
      responses: {
        "200": {
          description: "Relatório.",
          content: json("FinancialReport"),
        },
        "400": error("Período inválido."),
        ...denied,
      },
    },
  },
  "/api/admin/reports/sales": {
    get: {
      summary: "Vendas do período com CMV e margem (somente ADMIN)",
      description:
        "Da mais recente à mais antiga, 20 por página. Além do fim, responde a última página.",
      security: [{ session: [] }],
      parameters: [
        ...periodParameters,
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1 },
        },
      ],
      responses: {
        "200": {
          description: "Página de vendas.",
          content: json("ReportSalesPage"),
        },
        "400": error("Período ou página inválidos."),
        ...denied,
      },
    },
  },
  "/api/admin/reports/daily-email": {
    post: {
      summary: "Envia o resumo financeiro do dia por e-mail (somente ADMIN)",
      description:
        "Envia o resumo de hoje, em HTML e texto, para o e-mail da conta que pediu. Até 5 envios por hora por usuário.",
      security: [{ session: [], csrf: [] }],
      responses: {
        "200": {
          description: "E-mail enviado.",
          content: json("DailySummarySent"),
        },
        "401": error("Sem sessão."),
        "403": error(
          "Perfil sem permissão (CASHIER) ou cabeçalho anti-CSRF ausente ou inválido.",
        ),
        "429": tooMany("Limite de envios excedido."),
        "502": error("O serviço de e-mail falhou."),
      },
    },
  },
};
