import { body, error, formError, json } from "./openapi-helpers";

/** Paths of the account, store and team routes (all ADMIN only). */
export const adminPaths = {
  "/api/account": {
    get: {
      summary: "Usuário da sessão e nome da loja (somente ADMIN)",
      security: [{ session: [] }],
      responses: {
        "200": { description: "Conta.", content: json("AccountResponse") },
        "401": error("Sem sessão."),
        "403": error("Perfil sem permissão (CASHIER)."),
      },
    },
  },
  "/api/account/password": {
    post: {
      summary: "Altera a própria senha (somente ADMIN)",
      description:
        "Exige a senha atual. Encerra as outras sessões do usuário e mantém a atual.",
      security: [{ session: [], csrf: [] }],
      requestBody: body("ChangePasswordRequest"),
      responses: {
        "204": { description: "Senha alterada." },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": error(
          "Perfil sem permissão (CASHIER) ou cabeçalho anti-CSRF ausente ou inválido.",
        ),
        "422": formError(
          "Senha atual incorreta (fields.current) ou nova senha fora da regra (fields.next).",
        ),
      },
    },
  },
  "/api/account/sessions/revoke-others": {
    post: {
      summary: "Encerra as outras sessões do usuário (somente ADMIN)",
      security: [{ session: [], csrf: [] }],
      responses: {
        "200": {
          description: "Quantidade de sessões encerradas.",
          content: json("RevokedSessions"),
        },
        "401": error("Sem sessão."),
        "403": error(
          "Perfil sem permissão (CASHIER) ou cabeçalho anti-CSRF ausente ou inválido.",
        ),
      },
    },
  },
  "/api/store": {
    get: {
      summary: "Dados da loja e inatividade da sessão (somente ADMIN)",
      security: [{ session: [] }],
      responses: {
        "200": { description: "Loja.", content: json("StoreResponse") },
        "401": error("Sem sessão."),
        "403": error("Perfil sem permissão (CASHIER)."),
        "404": error("Loja não encontrada."),
      },
    },
    patch: {
      summary: "Altera os dados da loja (somente ADMIN)",
      description:
        "sessionIdle é 1h, 8h, 24h ou never. O documento é gravado só com dígitos.",
      security: [{ session: [], csrf: [] }],
      requestBody: body("UpdateStoreRequest"),
      responses: {
        "200": { description: "Loja.", content: json("StoreResponse") },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": error(
          "Perfil sem permissão (CASHIER) ou cabeçalho anti-CSRF ausente ou inválido.",
        ),
        "404": error("Loja não encontrada."),
        "422": formError("Campos inválidos (fields)."),
      },
    },
  },
  "/api/admin/users": {
    get: {
      summary: "Lista os usuários (somente ADMIN)",
      description:
        "pending indica convite sem senha definida; lastLoginAt é nulo até o primeiro acesso.",
      security: [{ session: [] }],
      responses: {
        "200": { description: "Usuários.", content: json("UsersList") },
        "401": error("Sem sessão."),
        "403": error("Perfil sem permissão (CASHIER)."),
      },
    },
    post: {
      summary: "Convida um usuário (somente ADMIN)",
      description:
        "Cria o usuário sem senha e envia por e-mail um código de 6 dígitos válido por 48 h, usado em Recuperar senha.",
      security: [{ session: [], csrf: [] }],
      requestBody: body("InviteUserRequest"),
      responses: {
        "201": { description: "Usuário criado.", content: json("UserRow") },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": error(
          "Perfil sem permissão (CASHIER) ou cabeçalho anti-CSRF ausente ou inválido.",
        ),
        "409": formError("O e-mail já tem conta (fields.email)."),
        "422": formError("Campos inválidos (fields)."),
      },
    },
  },
  "/api/admin/users/{id}": {
    patch: {
      summary: "Edita ou ativa/desativa um usuário (somente ADMIN)",
      description:
        "Desativar encerra todas as sessões do usuário. Recusado com 409 se deixaria a loja sem administrador ativo ou se o ADMIN desativasse o próprio acesso.",
      security: [{ session: [], csrf: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: body("UpdateUserRequest"),
      responses: {
        "200": { description: "Usuário.", content: json("UserRow") },
        "400": error("Corpo inválido."),
        "401": error("Sem sessão."),
        "403": error(
          "Perfil sem permissão (CASHIER) ou cabeçalho anti-CSRF ausente ou inválido.",
        ),
        "404": error("Usuário não encontrado."),
        "409": error(
          "Mantenha ao menos um administrador ativo, ou o ADMIN não pode desativar o próprio acesso.",
        ),
        "422": formError("Campos inválidos (fields)."),
      },
    },
  },
};
