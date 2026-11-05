import {
  accountResponseSchema,
  changePasswordSchema,
  revokedSessionsSchema,
} from "./account";
import { activityPageSchema } from "./activity";
import {
  cashMovementRowSchema,
  cashMovementSchema,
  cashSessionsPageSchema,
  closeCashSchema,
  closedCashSchema,
  openCashSchema,
  openCashSessionSchema,
} from "./cash";
import {
  CSRF_HEADER,
  SESSION_COOKIE,
  SIGNUP_COOKIE,
  errorResponseSchema,
  formErrorSchema,
  loginRequestSchema,
  loginResponseSchema,
  passwordResetConfirmSchema,
  passwordResetSchema,
  setupResponseSchema,
  signupRequestSchema,
  signupResendSchema,
  signupVerifySchema,
} from "./auth";
import {
  batchRowSchema,
  categoriesListResponseSchema,
  categoryRowSchema,
  consumeStockResponseSchema,
  consumeStockSchema,
  createBatchSchema,
  createCategorySchema,
  createProductSchema,
  inventoryPageSchema,
  productLookupSchema,
  productRowSchema,
  productSearchResponseSchema,
  productsPageSchema,
  updateProductSchema,
} from "./inventory";
import { adminPaths } from "./openapi-admin";
import { cashPaths } from "./openapi-cash";
import { inventoryPaths } from "./openapi-inventory";
import { salesPaths } from "./openapi-sales";
import {
  body,
  error,
  formError,
  json,
  jsonSchema,
  tooMany,
} from "./openapi-helpers";
import { createSaleSchema, saleReceiptSchema } from "./sales";
import { storeResponseSchema, updateStoreSchema } from "./store";
import { THEME_COOKIE, themeSchema } from "./theme";
import {
  inviteUserSchema,
  updateUserSchema,
  userRowSchema,
  usersListResponseSchema,
} from "./users";

/** The API contract. `npm run spec:generate` writes it to openapi.json; `npm run spec:check` verifies both. */
export function buildOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Mkt Control API",
      version: "0.1.0",
      description:
        "Sessão por cookie HTTP-only com token opaco guardado no banco. Requisições que alteram estado (exceto as rotas públicas de login, cadastro e recuperação de senha) exigem o cabeçalho anti-CSRF com o valor do cookie mkt_csrf.",
    },
    components: {
      securitySchemes: {
        session: { type: "apiKey", in: "cookie", name: SESSION_COOKIE },
        csrf: { type: "apiKey", in: "header", name: CSRF_HEADER },
      },
      schemas: {
        LoginRequest: jsonSchema(loginRequestSchema, "input"),
        LoginResponse: jsonSchema(loginResponseSchema),
        SetupResponse: jsonSchema(setupResponseSchema),
        SignupRequest: jsonSchema(signupRequestSchema, "input"),
        SignupVerifyRequest: jsonSchema(signupVerifySchema, "input"),
        SignupResendRequest: jsonSchema(signupResendSchema, "input"),
        PasswordResetRequest: jsonSchema(passwordResetSchema, "input"),
        PasswordResetConfirmRequest: jsonSchema(
          passwordResetConfirmSchema,
          "input",
        ),
        AccountResponse: jsonSchema(accountResponseSchema),
        ChangePasswordRequest: jsonSchema(changePasswordSchema, "input"),
        RevokedSessions: jsonSchema(revokedSessionsSchema),
        StoreResponse: jsonSchema(storeResponseSchema),
        UpdateStoreRequest: jsonSchema(updateStoreSchema, "input"),
        CategoryRow: jsonSchema(categoryRowSchema),
        CategoriesListResponse: jsonSchema(categoriesListResponseSchema),
        CreateCategoryRequest: jsonSchema(createCategorySchema, "input"),
        ProductRow: jsonSchema(productRowSchema),
        ProductsPage: jsonSchema(productsPageSchema),
        InventoryPage: jsonSchema(inventoryPageSchema),
        ProductLookup: jsonSchema(productLookupSchema),
        ProductSearchResponse: jsonSchema(productSearchResponseSchema),
        CreateSaleRequest: jsonSchema(createSaleSchema, "input"),
        SaleReceipt: jsonSchema(saleReceiptSchema),
        OpenCashRequest: jsonSchema(openCashSchema, "input"),
        OpenCashSession: jsonSchema(openCashSessionSchema),
        CashMovementRequest: jsonSchema(cashMovementSchema, "input"),
        CashMovementRow: jsonSchema(cashMovementRowSchema),
        CloseCashRequest: jsonSchema(closeCashSchema, "input"),
        ClosedCash: jsonSchema(closedCashSchema),
        CashSessionsPage: jsonSchema(cashSessionsPageSchema),
        CreateProductRequest: jsonSchema(createProductSchema, "input"),
        UpdateProductRequest: jsonSchema(updateProductSchema, "input"),
        BatchRow: jsonSchema(batchRowSchema),
        CreateBatchRequest: jsonSchema(createBatchSchema, "input"),
        ConsumeStockRequest: jsonSchema(consumeStockSchema, "input"),
        ConsumeStockResponse: jsonSchema(consumeStockResponseSchema),
        UserRow: jsonSchema(userRowSchema),
        UsersList: jsonSchema(usersListResponseSchema),
        InviteUserRequest: jsonSchema(inviteUserSchema, "input"),
        UpdateUserRequest: jsonSchema(updateUserSchema, "input"),
        ThemeRequest: jsonSchema(themeSchema, "input"),
        ActivityPage: jsonSchema(activityPageSchema),
        Error: jsonSchema(errorResponseSchema),
        FormError: jsonSchema(formErrorSchema),
      },
    },
    paths: {
      "/api/setup": {
        get: {
          summary: "Informa se a loja já foi criada",
          description:
            'Público. As telas usam para oferecer ou esconder "Criar conta da loja".',
          responses: {
            "200": { description: "Estado.", content: json("SetupResponse") },
            "403": error("Origem diferente do servidor."),
          },
        },
      },
      "/api/theme": {
        post: {
          summary: "Guarda a escolha de tema (claro, escuro ou sistema)",
          description: `Público. Define o cookie ${THEME_COOKIE} (HTTP-only, 1 ano) que o servidor aplica em <html data-theme>; "system" apaga o cookie e o app volta a seguir o sistema.`,
          requestBody: body("ThemeRequest"),
          responses: {
            "204": { description: "Escolha gravada (ou apagada)." },
            "400": error("Corpo inválido."),
            "403": error("Origem diferente do servidor."),
          },
        },
      },
      "/api/auth/login": {
        post: {
          summary: "Autentica o administrador e abre a sessão",
          description:
            "Limite de 10 tentativas por IP a cada 15 minutos; a 11ª recebe 429. Com remember=true os cookies duram 30 dias deslizantes; sem, acabam com o navegador (12 h no servidor). Se a requisição já tem sessão, ela é encerrada.",
          requestBody: body("LoginRequest"),
          responses: {
            "200": {
              description: `Sessão criada; define os cookies ${SESSION_COOKIE} (HTTP-only) e mkt_csrf.`,
              content: json("LoginResponse"),
            },
            "400": error("Corpo inválido."),
            "401": error("E-mail ou senha incorretos."),
            "422": formError("E-mail inválido (fields)."),
            "403": error("Acesso desativado ou origem diferente do servidor."),
            "429": tooMany("Limite de tentativas excedido."),
          },
        },
      },
      "/api/auth/logout": {
        post: {
          summary: "Encerra a sessão",
          security: [{ session: [], csrf: [] }],
          responses: {
            "204": { description: "Cookies de sessão removidos." },
            "401": error("Sem sessão válida; os cookies também são removidos."),
            "403": error("Cabeçalho anti-CSRF ausente ou inválido."),
          },
        },
      },
      "/api/auth/signup": {
        post: {
          summary: "Pede o cadastro da loja e envia o código por e-mail",
          description:
            "Só enquanto não há loja. Grava o pedido e envia um código de 6 dígitos (10 min, 5 tentativas). Novo pedido para o mesmo e-mail só após 60 s. Limite de 10 por IP a cada 15 minutos.",
          requestBody: body("SignupRequest"),
          responses: {
            "202": {
              description: `Código enviado; define o cookie ${SIGNUP_COOKIE} (HTTP-only, Path=/api/auth/signup, 10 min) que prova que este navegador iniciou o cadastro.`,
            },
            "400": error("Corpo inválido."),
            "403": error("Origem diferente do servidor."),
            "409": formError(
              "A loja já foi criada, ou o e-mail já tem conta (fields.email).",
            ),
            "422": formError("Campos inválidos (fields)."),
            "429": tooMany("Limite excedido ou novo código antes de 60 s."),
          },
        },
      },
      "/api/auth/signup/verify": {
        post: {
          summary:
            "Confirma o código, cria a loja e o administrador e abre a sessão",
          description: `Limite de 10 por IP a cada 15 minutos. Cinco códigos errados bloqueiam o código. Exige o cookie ${SIGNUP_COOKIE} do cadastro; ele é removido ao concluir.`,
          requestBody: body("SignupVerifyRequest"),
          responses: {
            "200": {
              description: `Conta criada; define os cookies ${SESSION_COOKIE} (HTTP-only) e mkt_csrf.`,
              content: json("LoginResponse"),
            },
            "400": error("Corpo inválido."),
            "403": error("Origem diferente do servidor."),
            "409": formError(
              "A loja já foi criada, o e-mail já tem conta, ou o cadastro expirou/foi substituído (cookie ausente ou diferente).",
            ),
            "422": formError(
              "Código incorreto, expirado ou campos inválidos (fields).",
            ),
            "429": tooMany("Limite de tentativas excedido."),
          },
        },
      },
      "/api/auth/signup/resend": {
        post: {
          summary: "Reenvia o código do cadastro",
          description: `No máximo um código por minuto para o mesmo e-mail. Exige o cookie ${SIGNUP_COOKIE} do cadastro.`,
          requestBody: body("SignupResendRequest"),
          responses: {
            "202": { description: "Código enviado." },
            "400": error("Corpo inválido."),
            "403": error("Origem diferente do servidor."),
            "404": error("Não há cadastro em andamento para o e-mail."),
            "409": formError(
              "A loja já foi criada, o e-mail já tem conta, ou o cadastro expirou/foi substituído (cookie ausente ou diferente).",
            ),
            "422": formError("E-mail inválido (fields)."),
            "429": tooMany("Limite excedido ou novo código antes de 60 s."),
          },
        },
      },
      "/api/auth/password-reset": {
        post: {
          summary: "Pede um código de redefinição de senha",
          description:
            "Responde 202 do mesmo jeito exista ou não conta ativa com o e-mail (sem enumeração).",
          requestBody: body("PasswordResetRequest"),
          responses: {
            "202": {
              description: "Se houver conta, o código chega por e-mail.",
            },
            "400": error("Corpo inválido."),
            "403": error("Origem diferente do servidor."),
            "422": formError("E-mail inválido (fields)."),
            "429": tooMany("Limite de tentativas excedido."),
          },
        },
      },
      "/api/auth/password-reset/confirm": {
        post: {
          summary: "Redefine a senha com o código",
          description:
            "Troca a senha, consome o código e encerra todas as sessões do usuário. Qualquer falha do código tem a mesma mensagem.",
          requestBody: body("PasswordResetConfirmRequest"),
          responses: {
            "204": { description: "Senha redefinida." },
            "400": error("Corpo inválido."),
            "403": error("Origem diferente do servidor."),
            "422": formError(
              "Código inválido ou expirado, ou campos inválidos (fields).",
            ),
            "429": tooMany("Limite de tentativas excedido."),
          },
        },
      },
      ...adminPaths,
      ...inventoryPaths,
      ...salesPaths,
      ...cashPaths,
      "/api/admin/activity": {
        get: {
          summary:
            "Registro de atividade, do mais recente ao mais antigo (somente ADMIN)",
          description:
            "50 itens por página. Envie nextCursor, sem alterá-lo, em ?cursor= para a página seguinte.",
          security: [{ session: [] }],
          parameters: [
            {
              name: "cursor",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Página.", content: json("ActivityPage") },
            "400": error("Cursor inválido."),
            "401": error("Sem sessão."),
            "403": error("Perfil sem permissão (CASHIER)."),
          },
        },
      },
    },
  };
}
