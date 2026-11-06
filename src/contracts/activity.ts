import { z } from "zod";

export const ACTIVITY_ACTIONS = [
  "Login",
  "Logout",
  "Conta criada",
  "Senha alterada",
  "Senha redefinida",
  "Sessões encerradas",
  "Usuário adicionado",
  "Usuário alterado",
  "Usuário desativado",
  "Dados da loja alterados",
  "Categoria criada",
  "Produto criado",
  "Produto alterado",
  "Caixa aberto",
  "Sangria registrada",
  "Suprimento registrado",
  "Caixa fechado",
  "Resumo diário enviado",
  "Fornecedor cadastrado",
  "Fornecedor alterado",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const activityItemSchema = z.object({
  id: z.uuid(),
  at: z.iso.datetime(),
  userName: z.string(),
  action: z.string(),
  detail: z.string(),
});

export const activityPageSchema = z.object({
  items: z.array(activityItemSchema),
  // Opaque to clients: pass it back unchanged as ?cursor= to get the next page.
  nextCursor: z.string().nullable(),
});

export type ActivityItem = z.infer<typeof activityItemSchema>;
export type ActivityPage = z.infer<typeof activityPageSchema>;
