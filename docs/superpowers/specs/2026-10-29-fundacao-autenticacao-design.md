# Subprojeto 1 — Fundação, autenticação e shell do painel

Data: 2026-10-29. Status: aprovado pelo dono do produto ("tudo aprovado, defina o que for recomendado").

## Contexto

O design do painel administrativo (artifact `29ST2Y3TN4jkLMMPH2DPxQ`) está salvo em `docs/design-reference/painel-admin.dc.html`: marcação com `{{ }}` e `<sc-if>` e, no fim, o `<script type="text/x-dc">` com dados e regras. É a referência visual e de texto; a implementação usa o design system (`@ds/components`, tokens do `DESIGN.md`).

O sistema completo foi decomposto em 6 subprojetos, cada um com spec, plano e execução próprios:

1. **Fundação, autenticação e shell** (este documento).
2. Catálogo e estoque: produtos, importação, lotes/PVPS, entradas, perdas, reposição.
3. Caixa: abertura, sangria, suprimento, fechamento cego, histórico.
4. Vendas: lista, detalhe, cancelamento com estorno, 2ª via.
5. Painel e relatórios.
6. Configurações de estoque e caixa e demais ajustes do design.

## Decisões

| Tema           | Decisão                                                                                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lojas          | Uma loja por instalação. "Criar conta da loja" só existe enquanto não há loja.                                                                                                                                                                           |
| Identificação  | E-mail para todos os usuários (ADMIN e CASHIER). `username` deixa de existir.                                                                                                                                                                            |
| Painel         | Exclusivo do perfil `ADMIN`. `CASHIER` recebe "Este painel é exclusivo para administradores. Operadores usam o PDV."                                                                                                                                     |
| Sessão         | Tabela `sessions` com token opaco no cookie (o JWT sai). "Manter conectado": 30 dias deslizantes. Sem ele: cookie de sessão do navegador e no máximo 12 h no servidor. Logout, troca de senha, desativação e "Encerrar outras sessões" revogam no banco. |
| Inatividade    | Configuração da loja "Encerrar sessão por inatividade": 1 h, 8 h, 24 h ou nunca (padrão 8 h), comparada com `last_used_at`.                                                                                                                              |
| Demonstração   | Links "Demonstração" só com `NODE_ENV=development`; o seed de desenvolvimento cria loja e usuários de demonstração. Em produção não há usuário nem link de demo.                                                                                         |
| E-mail         | Interface `Mailer`. Produção: Resend (`RESEND_API_KEY`, `MAIL_FROM` obrigatórios). Sem chave fora de produção: o código vai para o log do servidor.                                                                                                      |
| Tema           | Cookie `mkt_theme` (`light`/`dark`/ausente = sistema). O layout aplica `data-theme` no servidor; sem cookie, CSS segue `prefers-color-scheme`.                                                                                                           |
| Menu           | Mostra só páginas implementadas. Neste subprojeto: Painel (boas-vindas), Usuários (Equipe e Registro de atividade) e Configurações (Dados da loja, Conta e segurança).                                                                                   |
| Convite        | "Adicionar usuário" cria o usuário sem senha e envia por e-mail um código de definição de senha válido por 48 h, usado na tela "Recuperar senha".                                                                                                        |
| Fora do escopo | "Pedir código por e-mail em novos dispositivos" (2FA), ocultar valores do topo, notificações e selo do caixa (dependem dos subprojetos 2 e 3).                                                                                                           |

## Dados (Drizzle + migration)

- `stores` (uma linha): `id`, `name`, `document` (só dígitos, CPF 11 ou CNPJ 14), `phone`, `kind` (Mercadinho, Padaria, Açougue, Hortifrúti, Loja de conveniência, Outro), `address`, `session_idle` (`1h`/`8h`/`24h`/`never`, padrão `8h`), `created_at`, `updated_at`.
- `users`: `id`, `name`, `email` (único, minúsculas), `password_hash` (nulo até o convidado definir a senha), `role`, `active` (padrão true), `last_login_at`, `created_at`, `password_changed_at`. A migration remove `username`; por haver usuários de desenvolvimento, a migration apaga as linhas existentes de `users` (documentado em `docs/onboarding.md`: recriar com `user:create` ou `db:seed`).
- `sessions`: `id` (sha-256 do token, hex), `user_id` (FK, cascade), `csrf_hash` (sha-256 do token CSRF), `remember`, `expires_at`, `created_at`, `last_used_at`, `user_agent`, `ip`.
- `verification_codes`: `id`, `purpose` (`signup`, `password_reset`), `email`, `code_hash` (scrypt), `expires_at`, `attempts`, `consumed_at`, `created_at`, `payload` (jsonb, só para `signup`: nome, hash da senha, dados da loja).
- `activity_log`: `id`, `user_id` (nulo para eventos anônimos), `user_name` (cópia), `action`, `detail`, `created_at`.

## Regras

- **Senha:** 8 ou mais caracteres, com letra e número; máximo 256. Hash scrypt atual.
- **Códigos:** 6 dígitos aleatórios (`crypto.randomInt`), hash scrypt, validade de 10 min (48 h no convite), 5 tentativas; novo código invalida o anterior do mesmo e-mail e finalidade; reenvio no máximo 1 a cada 60 s.
- **Recuperação:** sempre responde igual, exista ou não a conta (sem enumeração). Confirmar troca a senha, consome o código e revoga todas as sessões do usuário.
- **Cadastro:** passos 1 e 2 validados no cliente e no servidor; `POST /api/auth/signup` grava o pedido em `verification_codes.payload` e envia o código; `POST /api/auth/signup/verify` cria loja + ADMIN numa transação e abre a sessão. Ambos recusam (409) se já houver loja. E-mail já usado: "Este e-mail já tem conta. Entre ou recupere a senha."
- **Login:** e-mail + senha + `remember`. Mensagens do design: credenciais erradas → "E-mail ou senha incorretos."; inativo → "Este acesso está desativado. Fale com o administrador da loja."; CASHIER → mensagem de exclusividade. Rate limit atual (10/15 min por IP) vale para login, cadastro, recuperação e verificação.
- **Sessão:** validada em cada requisição (proxy e rotas) com uma consulta; atualiza `last_used_at` no máximo uma vez por minuto; expira por `expires_at` ou inatividade da loja.
- **CSRF:** mantém o cookie legível `mkt_csrf` + cabeçalho `x-csrf-token` e a checagem de origem; o token CSRF passa a ser gerado por sessão e guardado em `sessions.csrf_hash`.
- **Atividade:** registra login, logout, conta criada, senha alterada, senha redefinida, sessões encerradas, usuário adicionado/alterado/desativado, dados da loja alterados.
- **Usuários (Equipe):** ADMIN lista, adiciona (nome, e-mail, perfil), edita e desativa. Não pode desativar a si mesmo nem rebaixar o último ADMIN ativo. Desativar revoga as sessões do usuário.

## Rotas (contrato Zod + OpenAPI, `guard` em todas)

| Rota                                             | Acesso            | Resultado                                               |
| ------------------------------------------------ | ----------------- | ------------------------------------------------------- |
| `GET /api/setup`                                 | público           | `{ hasStore }`                                          |
| `POST /api/auth/login`                           | público           | sessão + `{ user, csrfToken }`                          |
| `POST /api/auth/logout`                          | sessão            | 204                                                     |
| `POST /api/auth/signup`                          | público, sem loja | 202                                                     |
| `POST /api/auth/signup/verify`                   | público, sem loja | sessão + `{ user, csrfToken }`                          |
| `POST /api/auth/signup/resend`                   | público, sem loja | 202                                                     |
| `POST /api/auth/password-reset`                  | público           | 202                                                     |
| `POST /api/auth/password-reset/confirm`          | público           | 204                                                     |
| `GET /api/account`                               | ADMIN             | usuário atual + loja                                    |
| `POST /api/account/password`                     | ADMIN             | 204; revoga as outras sessões                           |
| `POST /api/account/sessions/revoke-others`       | ADMIN             | `{ revoked }`                                           |
| `GET /api/store` / `PATCH /api/store`            | ADMIN             | dados da loja e `session_idle`                          |
| `GET /api/admin/users` / `POST /api/admin/users` | ADMIN             | lista / convite                                         |
| `PATCH /api/admin/users/{id}`                    | ADMIN             | edição e ativação                                       |
| `GET /api/admin/activity`                        | ADMIN             | página de 50 itens, mais recentes primeiro (`?cursor=`) |
| `POST /api/theme`                                | público           | grava o cookie `mkt_theme`                              |

Erros seguem `errorResponseSchema` (`{ error }`, mensagens em pt-BR) e, nos formulários, `{ error, fields?: Record<campo, mensagem> }` com 400/409/422.

## Telas

- **`/login`, `/cadastro`, `/recuperar`** (layout de autenticação do design): coluna de marca à esquerda em telas largas (título "Controle de vendas e estoque para o seu comércio." e os 4 itens), formulário à direita, botão de tema no canto. Login: "Entrar no painel", e-mail, senha com mostrar/ocultar, "Manter conectado", "Esqueci minha senha", botão "Entrar", "ou", "Criar conta da loja" (só sem loja), Demonstração (só em dev). Cadastro em 3 etapas com indicador, medidor de força (Fraca/Média/Forte), máscara de CNPJ/CPF, "Reenviar código". Recuperação em 3 estados com "Voltar para entrar".
- **Shell `/painel/*`** (só ADMIN): menu lateral com marca + nome da loja, itens do subprojeto, usuário (iniciais, nome, "Administrador", Sair); topo com título da página, botão de tema; gaveta no celular (< 900 px) com "Abrir menu". `/` redireciona: com sessão ADMIN → `/painel`; sem sessão → `/login`.
- **`/painel`**: data longa, saudação ("Bom dia/Boa tarde/Boa noite, Nome") e estado vazio com próximos passos.
- **`/painel/usuarios`**: abas Equipe (tabela Nome+e-mail, Perfil, Acesso, Último acesso; diálogo "Adicionar usuário"/"Editar usuário" com "Enviar convite"/"Salvar") e Registro de atividade (Quando, Usuário, Ação, Detalhe; "Carregar mais").
- **`/painel/configuracoes`**: cards "Dados da loja" (nome, CNPJ, telefone, endereço, "Salvar alterações") e "Conta e segurança" (e-mail, Aparência Claro/Escuro/Sistema, "Encerrar sessão por inatividade", "Alterar senha" em diálogo com senha atual/nova/confirmação, "Encerrar outras sessões").
- **Toasts** de confirmação como no design (`Toast` portado para o design system).
- Componentes novos no design system, conforme o `DESIGN.md`: `Tabs`, `Toast` (+ provedor), `Switch` não é necessário neste subprojeto.

## Testes

- Unidade (Vitest, sem banco): regras de senha, geração/verificação de código (expiração, tentativas, consumo), regra de sessão (expiração, inatividade, renovação), proteção do último ADMIN, máscara de documento.
- Rotas: cada rota com sucesso, validação, acesso negado (anônimo, CASHIER), CSRF, rate limit e sem enumeração na recuperação; services mockados como hoje.
- Integração com PostgreSQL real (`npm run test:db`, usa `DATABASE_URL_TEST`; roda no CI com serviço Postgres): repositories de usuários, sessões, códigos e atividade, cadastro em transação.
- E2E no navegador (Playwright via MCP na validação; roteiro registrado em `docs/quality.md`): cadastro → código no log → painel; login/logout; recuperação; convite; troca de senha; encerrar sessões; tema persistido.
- `npm run check` e `spec:check` verdes.
