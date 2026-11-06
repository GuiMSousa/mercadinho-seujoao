import { healthSchema } from "./health";
import { json, jsonSchema } from "./openapi-helpers";

export const healthSchemas = { Health: jsonSchema(healthSchema) };

/** Public monitoring path, for the Docker healthcheck and uptime monitors. */
export const healthPaths = {
  "/api/health": {
    get: {
      summary: "Saúde do servidor e do banco",
      description:
        "Pública e sem cache. Faz SELECT 1 no PostgreSQL; não descreve a falha na resposta (o motivo vai para o log).",
      responses: {
        "200": {
          description: "Servidor e banco respondendo.",
          content: json("Health"),
        },
        "503": {
          description: "Banco inacessível (status error, db disconnected).",
          content: json("Health"),
        },
      },
    },
  },
};
