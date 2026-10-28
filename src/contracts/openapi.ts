import { z } from "zod";
import {
  CSRF_HEADER,
  SESSION_COOKIE,
  errorResponseSchema,
  loginRequestSchema,
  loginResponseSchema,
  usersListResponseSchema,
} from "./auth";

// OpenAPI 3.1 schemas are JSON Schema 2020-12, which is what Zod emits; only $schema is dropped.
function jsonSchema(schema: z.ZodType, io: "input" | "output" = "output") {
  const json = z.toJSONSchema(schema, { io });
  delete json.$schema;
  return json;
}

const json = (name: string) => ({
  "application/json": { schema: { $ref: `#/components/schemas/${name}` } },
});
const error = (description: string) => ({
  description,
  content: json("Error"),
});

/** The API contract. `npm run spec:generate` writes it to openapi.json; `npm run spec:check` verifies both. */
export function buildOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Mkt Control API",
      version: "0.1.0",
      description:
        "Sessão por cookie HTTP-only com JWT. Requisições que alteram estado (exceto o login) exigem o cabeçalho anti-CSRF com o valor do cookie mkt_csrf.",
    },
    components: {
      securitySchemes: {
        session: { type: "apiKey", in: "cookie", name: SESSION_COOKIE },
        csrf: { type: "apiKey", in: "header", name: CSRF_HEADER },
      },
      schemas: {
        LoginRequest: jsonSchema(loginRequestSchema, "input"),
        LoginResponse: jsonSchema(loginResponseSchema),
        UsersList: jsonSchema(usersListResponseSchema),
        Error: jsonSchema(errorResponseSchema),
      },
    },
    paths: {
      "/api/auth/login": {
        post: {
          summary: "Autentica e abre a sessão",
          description:
            "Limite de 10 tentativas por IP a cada 15 minutos; a 11ª recebe 429.",
          requestBody: { required: true, content: json("LoginRequest") },
          responses: {
            "200": {
              description: `Sessão criada; define os cookies ${SESSION_COOKIE} (HTTP-only) e mkt_csrf.`,
              content: json("LoginResponse"),
            },
            "400": error("Corpo inválido."),
            "401": error("Usuário ou senha inválidos."),
            "403": error("Origem diferente do servidor."),
            "429": {
              description: "Limite de tentativas excedido.",
              headers: {
                "Retry-After": {
                  description: "Segundos até a próxima tentativa.",
                  schema: { type: "integer" },
                },
              },
              content: json("Error"),
            },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          summary: "Encerra a sessão",
          security: [{ session: [], csrf: [] }],
          responses: {
            "204": { description: "Cookies de sessão removidos." },
            "401": error("Sem sessão."),
            "403": error("Cabeçalho anti-CSRF ausente ou inválido."),
          },
        },
      },
      "/api/admin/users": {
        get: {
          summary: "Lista os usuários (somente ADMIN)",
          security: [{ session: [] }],
          responses: {
            "200": { description: "Usuários.", content: json("UsersList") },
            "401": error("Sem sessão."),
            "403": error("Perfil sem permissão (CASHIER)."),
          },
        },
      },
    },
  };
}
