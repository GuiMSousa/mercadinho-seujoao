# Fundação, autenticação e shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o login por usuário/JWT por autenticação por e-mail com sessões no banco, cadastro da loja, recuperação de senha, convite de usuários, registro de atividade, tema persistido e o shell do painel do ADMIN, seguindo o design de referência.

**Architecture:** Mesmo padrão do projeto: tabelas Drizzle em `src/infrastructure/db/schema`, regras em `src/domains/<feature>` (repository + service + teste), contratos Zod em `src/contracts` com OpenAPI gerado, rotas finas em `src/app/api` que começam por `guard(request)`, e páginas App Router que usam `@ds/components`. A sessão vira um token opaco (cookie `mkt_session`) cujo sha-256 é a chave da tabela `sessions`.

**Tech Stack:** Next.js 16.4 (App Router, `proxy.ts`), React 19.3, TypeScript 5.9, Drizzle 0.45 + PostgreSQL 18, Zod 4, Pino 10, Vitest 5, Tailwind 4 + design system próprio, Base UI 1.9.

**Spec:** `docs/superpowers/specs/2026-10-29-fundacao-autenticacao-design.md`. Referência visual e de textos: `docs/design-reference/painel-admin.dc.html` (marcação nas linhas 1–905; regras no `<script type="text/x-dc">` a partir da linha ~1066).

## Global Constraints

- Nenhuma dependência nova de runtime. Resend é chamado por `fetch` em `https://api.resend.com/emails`. `jose` sai do `package.json`.
- Interface em pt-BR com os textos exatos do design e da spec. Código, comentários e commits em inglês, como o resto do repositório.
- Estilo só por tokens do `DESIGN.md` (`@ds/components`, `cn` de `@ds/lib/cn`); o ESLint bloqueia hex, px e valores arbitrários.
- Toda rota de API entra em `src/contracts` + `openapi.json` (`npm run spec:generate`); `npm run spec:check` cobre todas.
- Toda rota começa com `guard(request)`; mutações autenticadas exigem `x-csrf-token`.
- Arquivos com no máximo 350 linhas (`quality/max-lines`).
- Senha: mínimo 8, máximo 256, ao menos uma letra e um número.
- Código: 6 dígitos, 10 min (48 h no convite), 5 tentativas, reenvio a cada 60 s no mínimo.
- Sessão: 30 dias deslizantes com "Manter conectado"; senão cookie de navegador e 12 h; inatividade da loja `1h`/`8h`/`24h`/`never` (padrão `8h`).
- Rate limit existente (`createRateLimiter`, 10 por 15 min por IP) em login, cadastro, reenvio, verificação, recuperação e confirmação.
- `npm run check` verde ao fim de cada task; commits pequenos com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- E-mail com maiúsculas ou espaços (`" Ana@Loja.com "`) deve logar e não duplicar contas: normalizar com trim + lowercase no contrato (Task 4 e Task 6 testam).
- Duas abas: logout ou "Encerrar outras sessões" em uma deve invalidar a outra na próxima requisição (Task 4 testa `readSession` depois de `revokeOthers`).
- Código errado 5 vezes e depois o correto deve falhar (Task 2 testa).
- Rebaixar ou desativar o último ADMIN ativo, inclusive a si mesmo, deve ser recusado com 409 (Task 7 testa).
- Cadastro concorrente quando a loja acabou de ser criada deve dar 409, nunca uma segunda loja (Task 6 testa com loja existente; a coluna única `stores.singleton` faz o segundo INSERT falhar, mapeado para 409).

---

### Task 1: Esquema, migration e testes de banco

**Files:**

- Modify: `src/infrastructure/db/schema/users.ts`, `src/infrastructure/db/schema/index.ts`
- Create: `src/infrastructure/db/schema/stores.ts`, `sessions.ts`, `verification-codes.ts`, `activity-log.ts`
- Create: `drizzle/0001_*.sql` (gerado + revisado), `vitest.db.config.mts`, `src/infrastructure/db/test-db.ts`
- Modify: `package.json` (script `test:db`), `.env.example` (`DATABASE_URL_TEST`), `.github/workflows/ci.yml` (serviço `postgres:18-alpine` + `npm run db:migrate` + `npm run test:db`), `compose.yaml` só se precisar de banco extra (preferir mesmo servidor com banco `mkt_control_test`)
- Test: `src/infrastructure/db/schema.db.test.ts`

**Interfaces:**

- Produces (Drizzle tables, exportadas por `@/infrastructure/db/schema`):
  - `stores`: `id uuid pk`, `singleton boolean not null default true unique` (garante uma linha), `name text`, `document text` (dígitos), `phone text`, `kind text`, `address text default ''`, `sessionIdle text default '8h'` (`'1h'|'8h'|'24h'|'never'`), `createdAt`, `updatedAt`.
  - `users`: `id`, `name text not null`, `email text not null unique`, `passwordHash text` (nullable), `role userRole`, `active boolean default true`, `lastLoginAt timestamptz`, `passwordChangedAt timestamptz`, `createdAt`.
  - `sessions`: `id text pk` (sha-256 hex do token), `userId uuid fk users cascade`, `csrfHash text`, `remember boolean`, `expiresAt`, `createdAt`, `lastUsedAt`, `userAgent text`, `ip text`; índice em `userId`.
  - `verificationCodes`: `id uuid`, `purpose pgEnum('verification_purpose',['signup','password_reset'])`, `email text`, `codeHash text`, `expiresAt`, `attempts integer default 0`, `consumedAt`, `createdAt`, `payload jsonb`; índice `(email, purpose)`.
  - `activityLog`: `id uuid`, `userId uuid fk set null`, `userName text`, `action text`, `detail text default ''`, `createdAt`; índice em `createdAt desc`.
  - Tipos: `Role`, `SessionIdle = '1h'|'8h'|'24h'|'never'`, `VerificationPurpose`.
- Produces: `withTestDb(fn)` em `test-db.ts`: cria um `drizzle` sobre `DATABASE_URL_TEST`, roda `fn(db)` dentro de uma transação e faz rollback (isolamento por teste).

- [ ] **Step 1:** Escrever `schema.db.test.ts`: insere loja, usuário, sessão, código e atividade via `withTestDb`; espera que uma segunda loja falhe (`stores_singleton`), que dois usuários com o mesmo e-mail falhem e que apagar o usuário apague as sessões e anule `activity_log.user_id`.
- [ ] **Step 2:** `npm run test:db` → FAIL (tabelas não existem).
- [ ] **Step 3:** Escrever as tabelas; `npm run db:generate`; revisar o SQL: a migration começa com `DELETE FROM "users";` (comentário explicando: usuários de dev são recriados com `user:create`/`db:seed`), remove `username`, adiciona colunas. Criar o banco de teste uma vez com `docker compose ... exec postgres createdb mkt_control_test` documentado em `docs/onboarding.md`; `test:db` = `vitest run --config vitest.db.config.mts` (inclui só `**/*.db.test.ts`; `vitest.config.mts` passa a excluir esse sufixo).
- [ ] **Step 4:** `npm run db:migrate` (local e teste) e `npm run test:db` → PASS.
- [ ] **Step 5:** Commit `feat(db): add stores, sessions, verification codes and activity log tables`.

### Task 2: Senha e códigos de verificação

**Files:**

- Modify: `src/domains/auth/password.ts`
- Create: `src/domains/auth/codes.ts`
- Test: `src/domains/auth/password.test.ts`, `src/domains/auth/codes.test.ts`

**Interfaces:**

- Produces: `passwordRuleSchema` (Zod: string 8–256 com letra e número, mensagem `"Use 8 caracteres ou mais, com letras e números."`), exportado de `src/contracts/auth.ts` (Task 6 importa).
- Produces em `codes.ts` (puro, sem banco): `generateCode(): string` (6 dígitos via `crypto.randomInt`), `hashCode(code)`/`verifyCode(code, hash)` (reusam scrypt), `CODE_TTL_MS = 10 * 60_000`, `INVITE_TTL_MS = 48 * 3_600_000`, `MAX_ATTEMPTS = 5`, `RESEND_INTERVAL_MS = 60_000`, `checkCode(record, code, now): Promise<'ok'|'expired'|'consumed'|'too_many'|'wrong'>`.

- [ ] **Step 1:** Testes: `passwordRuleSchema` aceita `"abcd1234"`, recusa `"abcdefgh"`, `"12345678"`, `"a1"` e 257 caracteres; `generateCode` sempre casa `/^\d{6}$/` (100 amostras); `checkCode` retorna `wrong` e depois `too_many` quando `attempts >= 5` mesmo com o código certo, `expired` após `expiresAt`, `consumed` se `consumedAt` existir, `ok` no caso feliz.
- [ ] **Step 2:** Rodar `npx vitest run src/domains/auth` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** PASS. **Step 5:** Commit `feat(auth): add password rule and verification code primitives`.

### Task 3: Mailer

**Files:**

- Create: `src/infrastructure/mail/index.ts`, `src/infrastructure/mail/templates.ts`
- Modify: `src/lib/env-schema.ts`, `src/lib/env.ts`, `.env.example`
- Test: `src/infrastructure/mail/mail.test.ts`, `src/lib/env.test.ts`

**Interfaces:**

- Produces: `type Mailer = { send(message: { to: string; subject: string; text: string }): Promise<void> }`; `getMailer(): Mailer` (Resend via `fetch` com `Authorization: Bearer RESEND_API_KEY`, `from: MAIL_FROM`; sem chave e `NODE_ENV !== 'production'` → mailer que só faz `logger.info({ to, subject, text }, 'mail (dev)')`; em produção sem chave → lança erro de configuração). Resposta não-2xx do Resend lança `Error('mail delivery failed: <status>')` sem incluir o corpo.
- Produces em `templates.ts`: `signupCodeMail(code)`, `resetCodeMail(code)`, `inviteMail({ name, storeName, code })`, cada um `{ subject, text }` em pt-BR (assuntos: `"Seu código do Mkt Control"`, `"Redefinição de senha do Mkt Control"`, `"Você foi convidado para o Mkt Control"`; o convite explica abrir `/recuperar`, informar o e-mail e o código).
- Env: `RESEND_API_KEY` (opcional fora de produção), `MAIL_FROM` (padrão `"Mkt Control <no-reply@localhost>"` fora de produção). `SESSION_SECRET` sai do schema e do `.env.example`.

- [ ] Testes: `fetch` mockado recebe URL, cabeçalhos e corpo esperados; status 500 → rejeita sem vazar o corpo; dev sem chave chama o logger; produção sem chave lança. Implementar, PASS, commit `feat(mail): add Resend mailer with a development log fallback`.

### Task 4: Sessões no banco

**Files:**

- Create: `src/domains/auth/sessions.ts` (service), `src/domains/auth/sessions-repository.ts`
- Modify: `src/domains/auth/session.ts` → remover (JWT); `src/domains/auth/access.ts`, `src/app/api/_lib/guard.ts`, `src/proxy.ts`, `src/contracts/auth.ts`, `package.json` (remove `jose`)
- Test: `src/domains/auth/sessions.test.ts` (unitário com repository mockado), `src/domains/auth/sessions.db.test.ts`, `src/domains/auth/access.test.ts`, `src/proxy.test.ts`

**Interfaces:**

- Produces em `sessions.ts`:
  - `type AuthSession = { id: string; user: { id: string; name: string; email: string; role: Role }; csrfHash: string; remember: boolean }`
  - `createSession(input: { userId: string; remember: boolean; userAgent: string | null; ip: string }): Promise<{ token: string; csrfToken: string; maxAgeSeconds: number | null }>` (token e CSRF = 32 bytes base64url; `maxAgeSeconds` 30 dias com remember, `null` sem; `expiresAt` = agora + 30 d ou + 12 h).
  - `readSession(token: string | undefined, now?: Date): Promise<AuthSession | null>`: nulo se ausente, expirado, usuário inativo ou ocioso além de `stores.sessionIdle`; renova `lastUsedAt` se passou 1 min e, com remember, empurra `expiresAt` para agora + 30 d.
  - `revokeSession(id)`, `revokeOtherSessions(userId, keepId): Promise<number>`, `revokeAllSessions(userId)`.
  - `hashToken(token): string` (sha-256 hex).
- Produces em `access.ts`: `AccessRequest` troca `session: Session | null` por `session: { role: Role } | null` e `csrfHeader` por `csrfOk: boolean`. Caminhos públicos: `/`, `/login`, `/cadastro`, `/recuperar`, `/design-system`, `/api/setup`, `/api/theme`, `/api/auth/login`, `/api/auth/signup`, `/api/auth/signup/verify`, `/api/auth/signup/resend`, `/api/auth/password-reset`, `/api/auth/password-reset/confirm`. Prefixos só ADMIN: `/painel`, `/api/admin`, `/api/account`, `/api/store`.
- Produces em `guard.ts`: `guard(request) → { session: AuthSession | null; denial }` (`csrfOk = session && sha256(header) === session.csrfHash`); `setSessionCookies(request, response, { token, csrfToken, maxAgeSeconds })` (sem `maxAge` quando `null`; `secure` pela regra atual de protocolo); `clearSessionCookies(response)` sem mudança.
- `src/proxy.ts`: página sem sessão → `/login`; `/` com sessão ADMIN → `/painel`, sem sessão → `/login`; demais regras atuais.

- [ ] Testes unitários: expiração, ociosidade (`'1h'` com `lastUsedAt` há 61 min → null; `'never'` nunca), usuário inativo → null, renovação deslizante só com remember, `revokeOtherSessions` mantém só a atual. Teste de banco: criar 2 sessões, `revokeOtherSessions` → `readSession` da outra é null. Atualizar `access.test.ts` e `proxy.test.ts` para os novos caminhos e para `csrfOk`. Remover testes do JWT. Implementar, PASS, `npm run check`, commit `feat(auth): replace JWT with revocable database sessions`.

### Task 5: Registro de atividade

**Files:**

- Create: `src/domains/activity/repository.ts`, `src/domains/activity/service.ts`, `src/app/api/admin/activity/route.ts`
- Modify: `src/contracts/` (novo `activity.ts`), `src/contracts/openapi.ts`
- Test: `src/domains/activity/activity.db.test.ts`, `src/app/api/admin/activity/route.test.ts`

**Interfaces:**

- Produces: `logActivity(input: { user: { id: string; name: string } | null; action: ActivityAction; detail?: string }): Promise<void>` (nunca lança: falha vira `logger.error` para não derrubar a ação principal). `ActivityAction` = literais pt-BR: `'Login'`, `'Logout'`, `'Conta criada'`, `'Senha alterada'`, `'Senha redefinida'`, `'Sessões encerradas'`, `'Usuário adicionado'`, `'Usuário alterado'`, `'Usuário desativado'`, `'Dados da loja alterados'`.
- Produces: `listActivity({ cursor?: string; limit: 50 }): Promise<{ items: ActivityItem[]; nextCursor: string | null }>` com cursor = `createdAt` ISO + id (ordem decrescente estável).
- Contrato: `activityItemSchema { id, at (ISO), userName, action, detail }`, `activityPageSchema { items, nextCursor }`.

- [ ] Testes: paginação com 120 itens retorna 50/50/20 sem repetir; rota exige ADMIN (401 anônimo, 403 CASHIER); `logActivity` com banco falhando não rejeita. Implementar, `spec:generate`, PASS, commit `feat(activity): add activity log and its admin endpoint`.

### Task 6: Rotas públicas de autenticação

**Files:**

- Create: `src/domains/auth/signup.ts`, `src/domains/auth/password-reset.ts`, `src/domains/store/repository.ts`, `src/domains/store/service.ts`
- Modify: `src/domains/auth/service.ts`, `src/domains/auth/repository.ts`, `src/contracts/auth.ts`, `src/contracts/openapi.ts`
- Create routes: `src/app/api/setup/route.ts`, `src/app/api/auth/signup/route.ts`, `signup/verify/route.ts`, `signup/resend/route.ts`, `password-reset/route.ts`, `password-reset/confirm/route.ts`
- Modify routes: `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`
- Test: `route.test.ts` ao lado de cada rota; `src/domains/auth/signup.db.test.ts`; `src/domains/store/document.test.ts`

**Interfaces:**

- Contratos (`src/contracts/auth.ts`): `emailSchema` (trim, lowercase, `z.email()`, máx. 254, mensagem `"Informe um e-mail válido."`); `loginRequestSchema { email, password (1–256), remember: boolean default false }`; `signupRequestSchema { name (2+ palavras: "Informe nome e sobrenome."), email, password: passwordRuleSchema, storeName (1–80: "Informe o nome da loja."), document (só dígitos após limpar, 11 ou 14: "CNPJ ou CPF incompleto."), phone (opcional, até 20), kind (enum dos 6 tipos), terms: literal true ("Aceite os termos para continuar.") }`; `codeSchema` (`/^\d{6}$/`, "Digite os 6 números do código."); `signupVerifySchema { email, code }`; `passwordResetSchema { email }`; `passwordResetConfirmSchema { email, code, password }`; `authUserSchema { id, name, email, role }`; `loginResponseSchema { user: authUserSchema, csrfToken }`; `formErrorSchema { error, fields?: Record<string,string> }`; `setupResponseSchema { hasStore: boolean }`.
- `src/domains/store/document.ts`: `onlyDigits(v)`, `formatDocument(v)` (máscara CPF `000.000.000-00` / CNPJ `00.000.000/0000-00`, igual à do design).
- `authenticate(email, password)` → `{ ok: true, user } | { ok: false, reason: 'invalid' | 'inactive' | 'not_admin' | 'no_password' }` (mantém o hash fictício para e-mail desconhecido). Mensagens 401/403 da spec; `no_password` (convidado sem senha) usa a mesma mensagem de credenciais inválidas.
- `startSignup(input)`, `resendSignupCode(email)`, `completeSignup(email, code, meta)` → cria loja + ADMIN numa transação e retorna `AuthUser`; 409 `"Este e-mail já tem conta. Entre ou recupere a senha."` e 409 `"A loja já foi criada. Entre com sua conta."` quando há loja.
- `requestPasswordReset(email)` (silencioso para e-mail inexistente ou inativo), `confirmPasswordReset(email, code, password)` → troca senha, consome o código, `revokeAllSessions`.
- Login e verify chamam `createSession` + `setSessionCookies` + `logActivity`; logout chama `revokeSession` + `logActivity('Logout')`.

- [ ] Testes de rota (services mockados, padrão atual): login com `" Ana@Loja.com "` normaliza; CASHIER → 403 com a mensagem exata; inativo → 403; 11ª tentativa → 429; `remember:true` gera cookie com `Max-Age=2592000`, sem remember sem `Max-Age`. Signup: campos inválidos → 422 com `fields`; loja existente → 409. Recuperação: e-mail inexistente e existente respondem igual (202, mesmo corpo). Teste de banco: `completeSignup` cria loja + ADMIN + consome código; segunda chamada com outra conta → 409 e continua uma loja. Implementar, `spec:generate`, PASS, `npm run check`, commit `feat(auth): add email login, store signup and password reset`.

### Task 7: Conta, loja e usuários (rotas ADMIN)

**Files:**

- Create: `src/domains/users/service.ts`, `src/domains/users/repository.ts` (move `listUsers`/`insertUser` de auth), `src/contracts/account.ts`, `src/contracts/users.ts`, `src/contracts/store.ts`
- Create routes: `src/app/api/account/route.ts`, `account/password/route.ts`, `account/sessions/revoke-others/route.ts`, `src/app/api/store/route.ts`, `src/app/api/admin/users/[id]/route.ts`; Modify: `src/app/api/admin/users/route.ts`
- Test: `route.test.ts` de cada rota; `src/domains/users/users.db.test.ts`

**Interfaces:**

- `changePassword(session, current, next)` → 422 `{ fields: { current: "Senha atual incorreta." } }`; sucesso troca, `revokeOtherSessions`, `logActivity('Senha alterada')`.
- `inviteUser(actor, { name, email, role })` → cria usuário sem senha, gera código `password_reset` com `INVITE_TTL_MS`, envia `inviteMail`, `logActivity('Usuário adicionado', email)`; e-mail repetido → 409.
- `updateUser(actor, id, { name?, role?, active? })` → 409 `"Mantenha ao menos um administrador ativo."` quando a mudança deixaria zero ADMIN ativo; 409 `"Você não pode desativar o próprio acesso."`; desativar → `revokeAllSessions` + `logActivity('Usuário desativado')`.
- `userRowSchema { id, name, email, role, active, lastLoginAt: ISO|null, pending: boolean }` (`pending` = sem senha).
- `getStore()`/`updateStore(actor, { name, document, phone, address, sessionIdle })` com `logActivity('Dados da loja alterados', name)`; `storeSchema` reaproveita as regras de Task 6.
- `GET /api/account` → `{ user: authUserSchema, store: { name } }`.

- [ ] Testes: último ADMIN (rebaixar e desativar) → 409; desativar a si mesmo → 409; convite envia e-mail (mailer mockado) e cria `pending: true`; troca de senha com atual errada → 422 e revoga outras sessões no sucesso; `revoke-others` retorna `{ revoked: n }`; todas as rotas 401/403 para anônimo/CASHIER; PATCH sem CSRF → 403. Implementar, `spec:generate`, PASS, commit `feat(admin): add account, store and team management endpoints`.

### Task 8: Tema persistido

**Files:**

- Create: `src/app/api/theme/route.ts`, `src/app/theme.ts` (`getTheme()` lê o cookie no servidor)
- Modify: `src/app/layout.tsx` (`<html data-theme=...>` quando o cookie é `light`/`dark`), `design-system/tokens.css`, `design-system/tokens.test.ts`, `DESIGN.md` (seção Temas), `src/contracts/` (`themeSchema`)
- Test: `src/app/api/theme/route.test.ts`, `design-system/tokens.test.ts`

**Interfaces:**

- `POST /api/theme { theme: 'light'|'dark'|'system' }` → 204 e cookie `mkt_theme` (1 ano, `sameSite lax`, `httpOnly`; `system` apaga). Público, mas com checagem de origem.
- `tokens.css`: bloco `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ...mesmas declarações do [data-theme="dark"] } }`; `@custom-variant dark` vira a forma com `@slot` cobrindo atributo e mídia.
- `tokens.test.ts` ganha o teste "the system-dark block mirrors [data-theme=dark]" e o parser ignora esse bloco ao montar o mapa do tema claro.
- Componente cliente `ThemeControl` em `src/app/_components/theme-control.tsx`: `variant: 'icon' | 'tabs'` (ícone Lua/Sol no topo e na tela de login; abas Claro/Escuro/Sistema em Configurações) que faz `POST /api/theme` e `router.refresh()`.

- [ ] Testes: rota grava/apaga o cookie; valor inválido → 400; espelho de tokens. Implementar, PASS, commit `feat(theme): persist the color theme in a cookie applied on the server`.

### Task 9: Componentes Tabs e Toast no design system

**Files:**

- Create: `design-system/components/tabs.tsx` (Base UI `Tabs`), `design-system/components/toast.tsx` (Base UI `Toast`: `ToastProvider` + hook `useToast()` com `toast({ title, message?, tone: 'success'|'danger'|'warning'|'info' })`, 3,6 s)
- Modify: `src/app/design-system/page.tsx`/`demos.tsx` (exemplos), `DESIGN.md` (tabela de componentes; remover Tabs/Toast de "Ainda não portados"), `src/app/layout.tsx` (envolve com `ToastProvider`)
- Spec visual: `design-system/references/components/navigation/Tabs.jsx`, `feedback/Toast.jsx`

**Interfaces:** `Tabs({ items: { value: string; label: string }[], value, onValueChange, 'aria-label' })`; `useToast()`.

- [ ] Verificação: lint/typecheck, vitrine no navegador (abas com teclado, toast aparece e some, leitor de tela anuncia via `role="status"` do Base UI). Commit `feat(ds): add Tabs and Toast components`.

### Task 10: Telas de autenticação

**Files:**

- Create: `src/app/(auth)/layout.tsx` (coluna de marca em ≥ 900 px com o título e os 4 itens, `ThemeControl variant="icon"`), `src/app/(auth)/login/page.tsx` + `login-form.tsx` (move de `src/app/login`), `src/app/(auth)/cadastro/page.tsx` + `signup-form.tsx`, `src/app/(auth)/recuperar/page.tsx` + `reset-form.tsx`, `src/app/(auth)/password-strength.tsx`
- Delete: `src/app/login/*`, `src/app/logout-button.tsx` (vai para o shell)
- Test: `src/app/(auth)/password-strength.test.ts`

**Interfaces:**

- `passwordScore(pw: string): 0|1|2|3` (regra do design: +1 se ≥ 8; +1 se letra e número; +1 se símbolo ou ≥ 12) e rótulos `['', 'Fraca', 'Média', 'Forte']`.
- Login: "Entrar no painel", "Acesso do administrador da loja.", e-mail (`autoComplete="username"`, placeholder `voce@sualoja.com.br`), senha com `IconButton` mostrar/ocultar, Checkbox "Manter conectado" (padrão marcado), link "Esqueci minha senha" → `/recuperar`, botão "Entrar" (`loading`), separador "ou" e "Criar conta da loja" (só quando `GET /api/setup` → `hasStore: false`; a página busca no servidor), "Demonstração: Administrador | Operador de caixa" só com `process.env.NODE_ENV === 'development'` preenchendo `ana@bompreco.com.br`/`carlos@bompreco.com.br` e `mkt12345`. Erros do servidor nos campos (`fields`) ou no formulário. Sucesso → `router.replace('/painel')`.
- Cadastro: indicador de 3 etapas, títulos/subtítulos exatos do design (`cadTitle`/`cadSub`), etapa 2 com máscara via `formatDocument`, Select "Tipo de comércio", Checkbox de termos; etapa 3 código (`inputMode="numeric"`, `maxLength 6`), "Não recebeu? Reenviar código" (desabilitado 60 s), "Voltar", "Já tem conta? Entrar". Com loja existente a página redireciona para `/login`.
- Recuperar: estados com `recTitle`/`recSub` do design, ícone de sucesso, "Voltar para entrar".

- [ ] Testes de `passwordScore`; verificação manual no navegador na Task 12. Commit `feat(auth-ui): add login, signup and password recovery screens`.

### Task 11: Shell e páginas do painel

**Files:**

- Create: `src/app/painel/layout.tsx` (servidor: `readSession` via cookies, sem sessão ADMIN → `redirect('/login')`; carrega nome da loja), `src/app/painel/_shell/sidebar.tsx`, `topbar.tsx`, `mobile-drawer.tsx` (cliente), `logout-button.tsx`
- Create: `src/app/painel/page.tsx`, `src/app/painel/usuarios/page.tsx` + `team-table.tsx` + `user-dialog.tsx` + `activity-table.tsx`, `src/app/painel/configuracoes/page.tsx` + `store-form.tsx` + `security-card.tsx` + `password-dialog.tsx`
- Modify: `src/app/page.tsx` (vira só `redirect`, conforme a regra do proxy), `src/proxy.test.ts`
- Create: `src/app/painel/_lib/api.ts` (cliente: `apiFetch(path, init)` que injeta `x-csrf-token` lido do cookie `mkt_csrf` e devolve `{ ok, status, data }`)
- Test: `src/app/painel/_lib/greeting.test.ts`

**Interfaces:**

- `NAV_ITEMS = [{ href: '/painel', label: 'Painel', icon: LayoutDashboard }, { href: '/painel/usuarios', label: 'Usuários', icon: Users }, { href: '/painel/configuracoes', label: 'Configurações', icon: Settings }]` (subprojetos futuros acrescentam itens aqui).
- `greeting(date: Date, name: string): string` ("Bom dia" < 12 h, "Boa tarde" < 18 h, "Boa noite"; primeiro nome) e `longDate(date)` (`toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' })`).
- Menu lateral: marca + nome da loja; item ativo por `usePathname`; rodapé com iniciais, nome, "Administrador" e `IconButton` "Sair". < 900 px: `IconButton` "Abrir menu" abre gaveta (Base UI Dialog lateral) com o mesmo conteúdo.
- Usuários: `Tabs` "Equipe" / "Registro de atividade" (estado na query `?aba=atividade`); tabela e diálogo conforme a spec; pendentes mostram `Badge` "Convite pendente".
- Configurações: card "Dados da loja" (salvar → toast "Dados da loja salvos") e card "Conta e segurança" (e-mail, `ThemeControl variant="tabs"`, Select "Encerrar sessão por inatividade" com as 4 opções do design, "Alterar senha" e "Encerrar outras sessões" com toast "Outras sessões encerradas" / "Somente este dispositivo continua conectado.").

- [ ] Testes de `greeting`/`longDate`; atualizar `proxy.test.ts`; lint/typecheck/build. Commit `feat(panel): add the admin shell, team, activity and settings pages`.

### Task 12: Seed, documentação e validação ponta a ponta

**Files:**

- Create: `scripts/seed-dev.mts` (`npm run db:seed`; recusa com `NODE_ENV=production`; cria loja "Mercadinho Bom Preço" e os usuários do design: Ana Ribeiro ADMIN `ana@bompreco.com.br`, Carlos Souza CASHIER `carlos@bompreco.com.br`, Juliana Lima CASHIER `juliana@bompreco.com.br`, senha `mkt12345`; idempotente)
- Modify: `scripts/create-user.mts` (`npm run user:create -- <email> "<Nome>" <ADMIN|CASHIER>`), `docs/onboarding.md`, `docs/architecture.md`, `docs/quality.md`, `docs/setup.md`, `AGENTS.md`, `PRODUCT.md` (decisões), `README.md`

- [ ] **Step 1:** Implementar o seed e o novo `user:create`; rodar `npm run db:seed` duas vezes (segunda não duplica).
- [ ] **Step 2:** `npm run check` e `npm run test:db` verdes.
- [ ] **Step 3:** Roteiro E2E no navegador (Playwright MCP) contra `npm run dev`, registrado em `docs/quality.md`: banco limpo → `/` vai a `/login` com "Criar conta da loja" → cadastro 3 etapas com código lido do log → `/painel` com saudação → convite de usuário (código no log) → definir senha em `/recuperar` → login do convidado CASHIER recusado com a mensagem → troca de senha → encerrar outras sessões derruba a segunda aba → tema escuro persiste após recarregar → logout volta a `/login`, e "Criar conta da loja" não aparece mais.
- [ ] **Step 4:** Commit `docs: document the email login, sessions and admin shell`.
