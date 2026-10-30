# Código e arquitetura

## Stack real

| Área             | Escolha                                                                                                                                                    | Versão                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Runtime          | Node.js LTS (`.nvmrc`, `engines`, Docker `node:24-alpine`, CI)                                                                                             | 24.x (local 24.22.1)                                |
| Gerenciador      | npm com `package-lock.json` (`packageManager: npm@11.19.1`)                                                                                                | 11.19.1                                             |
| Framework        | Next.js App Router, Turbopack, saída `standalone`                                                                                                          | 16.4.3                                              |
| UI               | React, Tailwind CSS (`@tailwindcss/turbopack`), shadcn/ui `base-nova` sobre Base UI, Lucide; design system em `design-system/` ([DESIGN.md](../DESIGN.md)) | 19.3.1 / 4.3.3 / CLI 4.23.0, Base UI 1.9.0 / 1.62.0 |
| Linguagem        | TypeScript estrito                                                                                                                                         | 5.9.3                                               |
| Dados            | Drizzle ORM + `pg`; drizzle-kit                                                                                                                            | 0.45.4 / 8.23.1 / 0.31.11                           |
| Banco            | PostgreSQL em Docker Compose                                                                                                                               | 18 (`postgres:18-alpine`, local 18.6)               |
| Validação e logs | Zod, Pino                                                                                                                                                  | 4.6.7 / 10.4.0                                      |
| Testes           | Vitest (Node)                                                                                                                                              | 5.0.5                                               |

As versões exatas estão no lockfile. As razões de cada escolha estão em [setup.md](setup.md).

## Mapa do código

```text
design-system/                # biblioteca de UI; contrato em DESIGN.md
├── tokens.css, tokens.test.ts # tokens (importados por src/app/globals.css) e teste do contrato
├── fonts.ts, assets/fonts/   # Hanken Grotesk via next/font/local
├── lib/                      # cn ciente das escalas, centavos, teclado numérico
├── components/               # Button, Input, Select, Checkbox, Badge, Money, Card, Table, Dialog, Tabs, Toast, Keypad
└── references/               # exportação do Claude Design (estática; ignorada por lint/TS/Tailwind)
src/
├── proxy.ts                  # gate otimista (Next 16 "proxy", ex-middleware): mesma regra das rotas
├── app/
│   ├── layout.tsx, page.tsx, theme.ts # layout pt-BR (tema lido do cookie no servidor); `/` decide entre /login e /painel
│   ├── (auth)/               # telas públicas: login/, cadastro/ (3 etapas), recuperar/ (também define a senha do convite)
│   ├── painel/               # shell do ADMIN: layout (guarda de perfil), _shell/ (sidebar, topbar, drawer móvel), page.tsx (saudação)
│   │   ├── usuarios/         # abas Equipe (convites, perfil, desativar) e Registro de atividade
│   │   └── configuracoes/    # dados da loja, tema, inatividade da sessão, alterar senha, encerrar outras sessões
│   ├── design-system/        # vitrine pública: componentes, estados e temas (dados fictícios)
│   └── api/
│       ├── _lib/guard.ts     # adaptador HTTP: lê a sessão, aplica accessDenial, define/limpa cookies
│       ├── _lib/public.ts    # rotas públicas: guard + limite por IP + validação (422 com `fields`) + sessão
│       ├── _lib/admin.ts     # rotas de ADMIN: guard + CSRF + validação
│       ├── setup, theme      # GET público `{ hasStore }`; POST do cookie de tema
│       ├── auth/login, auth/logout
│       ├── auth/signup, signup/verify, signup/resend
│       ├── auth/password-reset, password-reset/confirm
│       ├── account, account/password, account/sessions/revoke-others
│       ├── store             # dados e inatividade da loja (GET/PATCH)
│       └── admin/users, admin/users/[id], admin/activity
├── contracts/                # schemas Zod por área (auth, users, store, account, activity, theme) + openapi*.ts
│   └── openapi.json          # contrato versionado (npm run spec:generate)
├── domains/
│   ├── auth/                 # access.ts (regra única de acesso), sessions*.ts (sessões no banco), password.ts (scrypt),
│   │                         # login-rate-limit.ts, service.ts (authenticate), signup.ts, password-reset.ts,
│   │                         # codes.ts + verification*.ts (códigos por e-mail), repository.ts (único acesso a `users` no login)
│   ├── store/                # `stores`: uma loja por instalação; criação com o primeiro ADMIN (transação) e configurações
│   ├── users/                # equipe: listar, convidar, editar, desativar (último ADMIN protegido por transação com lock)
│   └── activity/             # registro de atividade (quem fez o quê)
├── lib/                      # env (Zod, server-only), logger Pino, `cn`, `document.ts` (máscara e dígitos de CPF/CNPJ)
└── infrastructure/
    ├── db/                   # index.ts: único ponto de conexão (pool max 5, lazy); schema/ (users, stores, sessions,
    │                         # verification-codes, activity-log); test-db.ts (transação com rollback nos testes)
    └── mail/                 # Resend por `fetch`; sem chave e fora de produção, só registra no log ("mail (dev)")
drizzle/                      # SQL versionado (0000: user_role + users; 0001_auth_foundation: loja, sessões, códigos, atividade)
scripts/                      # create-user.mts, seed-dev.mts, migrate-test.mjs, generate-openapi.mts, verify-quality-rules.mjs
eslint-rules/                 # regras locais do toolkit
```

Os testes ficam junto do código (`*.test.ts`); os `*.db.test.ts` precisam do banco `mkt_control_test`.

## Limites e fluxo

```text
src/app/api/<rota> (fina) ──> src/domains/<feature>/service ──> repository ──> src/infrastructure/db
        │      └── guard() = accessDenial() ◄── src/proxy.ts usa a mesma regra
        └── valida entrada/saída com src/contracts (Zod) ──> openapi.json
```

- **`src/domains/<feature>`:** regra de negócio. Os services não importam `next/*`. Só os repositories chamam `getDb()`.
- **`src/infrastructure`:** integrações: o banco e o e-mail (Resend).
- **`src/contracts`:** schemas Zod da API e o OpenAPI gerado deles.
- **Rotas:** começam com `guard(request)` e só depois validam a entrada, chamam o service e devolvem DTOs parseados pelo contrato.

**Autenticação** (`/api/auth/login`; cadastro e recuperação seguem os passos 1, 2 e 3, cada ação com seu próprio limitador):

1. **Origem:** requisição de outra origem → 403.
2. **Limites:** por IP, 10 tentativas a cada 15 minutos (a 11ª → 429 com `Retry-After`). O login tem ainda um limite por conta (e-mail normalizado): 20 tentativas a cada 15 minutos, porque os cabeçalhos de IP são controlados pelo cliente na LAN e o limite por IP sozinho pode ser contornado. A conferência da senha atual em `/api/account/password` tem limite próprio por usuário (10 a cada 15 minutos).
3. **Entrada:** validada com Zod; e-mail com trim e minúsculas.
4. **Senha:** conferida com scrypt, também quando o usuário não existe (não revela quais usuários existem). Só depois da senha certa aparecem "acesso desativado" (403) e "painel exclusivo para administradores" (403, `CASHIER`).
5. **Sessão:** token aleatório de 32 bytes no cookie `mkt_session` (HTTP-only, `SameSite=Lax`, `Secure` sob HTTPS); o banco guarda só o SHA-256 em `sessions.id`. Sem "manter conectado" o cookie é de navegador e a sessão dura 12 h; com ele, 30 dias deslizantes (o proxy renova os cookies com `Max-Age` de 30 dias quando a sessão desliza). Um login com sessão já aberta encerra a anterior. A inatividade segue `stores.sessionIdle` (padrão 8 h) e usuário inativo perde a sessão.
6. **CSRF:** token aleatório por sessão, guardado como SHA-256 em `sessions.csrfHash`, enviado no cookie legível `mkt_csrf` e na resposta.

**Acesso** (`accessDenial`, usado pelo proxy e por cada rota):

- Públicos: `/`, `/login`, `/cadastro`, `/recuperar`, `/design-system`, `/api/setup`, `/api/theme` e as rotas de `/api/auth` de entrada (login, cadastro, recuperação); qualquer outro caminho exige sessão (padrão seguro).
- `/painel`, `/api/admin`, `/api/account` e `/api/store` exigem `ADMIN`.
- Métodos que alteram estado exigem `x-csrf-token` cujo SHA-256 seja igual a `sessions.csrfHash` e mesma origem.
- O proxy redireciona páginas sem sessão para `/login`; em `/`, `ADMIN` vai para `/painel` e sem sessão vai para `/login`.

**Códigos por e-mail** (cadastro e recuperação): 6 dígitos, hash scrypt, 10 min, 5 tentativas, novo código invalida o anterior, 1 pedido por minuto e no máximo 10 códigos por e-mail e finalidade em 24 h (acima disso, 429 no cadastro; a recuperação segue respondendo 202 e não envia nada; convites criados por um ADMIN não passam por essa checagem). A tentativa é gasta num `UPDATE ... attempts + 1` condicional antes de comparar o hash, então palpites paralelos não passam de 5. A recuperação responde 202 igual para qualquer e-mail, envia o código fora do caminho da resposta e usa uma única mensagem para todo erro de código. O pedido de cadastro fica preso ao navegador que o iniciou: o payload guarda o SHA-256 de um nonce entregue no cookie HTTP-only `mkt_signup` (`Path=/api/auth/signup`, 10 min); `verify` e `resend` exigem o cookie (409 "Seu cadastro expirou. Comece de novo."), então ninguém substitui o pedido de outra pessoa. O código novo só invalida os anteriores (apenas os criados antes dele, então o mais novo sempre sobrevive) depois que o e-mail é enviado; o payload (hash da senha e do nonce) é apagado quando o código é usado ou substituído. Trocar a senha em Configurações também consome os códigos de recuperação abertos do e-mail, na mesma transação. As respostas levam `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` e `Referrer-Policy: same-origin` (`next.config.ts`). Toda página do painel que lê dados chama `requireAdmin()`, porque layouts não rodam de novo na navegação do cliente. O cadastro cria loja e ADMIN numa transação; a segunda loja falha em `stores_singleton` e vira 409.

**Painel** (`/painel`, só `ADMIN`):

- O `layout.tsx` confere sessão e perfil no servidor (o proxy é só o primeiro filtro) e monta sidebar, topbar e, abaixo de 900 px, um drawer com foco preso.
- As páginas de Usuários e Configurações carregam os dados no servidor e mudam por `fetch` às rotas de `/api/admin`, `/api/account` e `/api/store`, com o token CSRF. Avisos usam o `Toast` do design system.
- Rebaixar ou desativar o último `ADMIN` ativo, inclusive a si mesmo, responde 409.
- O tema (claro, escuro, sistema) fica no cookie `mkt_theme`, gravado por `POST /api/theme` e aplicado ao `<html data-theme>` no servidor, sem piscar na hidratação.
- Alterar a senha encerra as outras sessões do usuário; "Encerrar outras sessões" faz só isso.

Pastas novas só nascem com código real.

Guardas automáticas atuais (ESLint):

- `quality/no-direct-data-access` impede importar `getDb`/`db` de `@/infrastructure/db` em `src/app`, `src/components` e arquivos `.tsx`.
- `drizzle/enforce-delete-with-where` e `drizzle/enforce-update-with-where` exigem `where`.
- `quality/no-direct-console` aponta o logger.
- `quality/max-lines` limita arquivos a 350 linhas.

## Dados e migrations

- **Schema:** `src/infrastructure/db/schema/` (re-exportado por `index.ts`). Hoje: enums `user_role` (`ADMIN`, `CASHIER`) e `verification_purpose`, e as tabelas `users` (`id` uuid com `gen_random_uuid()`, `name`, `email` único sempre em minúsculas, `password_hash` anulável no formato `scrypt$N$r$p$salt$hash`, `role`, `active`, `last_login_at`, `password_changed_at`, `created_at`), `stores` (uma linha por instalação, garantida por `stores_singleton`), `sessions` (id = SHA-256 do token; apagada em cascata com o usuário), `verification_codes` e `activity_log` (`user_id` vira nulo ao apagar o usuário). Testes com banco real: `*.db.test.ts` via `npm run test:db`, cada um numa transação com rollback (`withTestDb`). As próximas tabelas virão do PRODUCT.md, fluxo a fluxo.
- **SQL versionado:** `drizzle/0000_needy_nightcrawler.sql` (cria `user_role` e `users`) e `drizzle/0001_auth_foundation.sql` (apaga os usuários antigos, troca `username` por `name`/`email` e cria loja, sessões, códigos e log de atividade). Gerar não exige conexão.
- **Aplicação:** `npm run db:migrate` usa `DATABASE_URL_UNPOOLED` ou `DATABASE_URL`, só no destino autorizado. Nunca durante build, import ou requisição. Sem `db:push` no fluxo padrão.
- **Conexão:** `getDb()` valida a URL com Zod e cria o pool só no primeiro uso. Por isso `lint`, `test` e `build` funcionam sem credenciais. `closeDatabase()` existe só para encerramento controlado e testes.
- **Transações:** obrigatórias em vendas (baixa PVPS de vários lotes, CMV e pagamento) e no caixa. O driver `pg` as suporta.
- **Dinheiro:** centavos inteiros; peso em gramas.

## Ambiente

| Variável                                                             | Onde                                 | Uso                                           |
| -------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------- |
| `DATABASE_URL`                                                       | runtime (app, drizzle-kit, scripts)  | Conexão PostgreSQL. Não é necessária no build |
| `DATABASE_URL_UNPOOLED`                                              | migrations (opcional)                | Conexão direta, se o provedor exigir          |
| `DATABASE_URL_TEST`                                                  | `npm run test:db`, `db:migrate:test` | Banco `mkt_control_test`, só para testes      |
| `RESEND_API_KEY`, `MAIL_FROM`                                        | runtime                              | E-mail (obrigatório em produção; em dev, log) |
| `LOG_LEVEL`                                                          | runtime                              | Nível do Pino (padrão `info`)                 |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Docker Compose                       | Credenciais do container local                |

Carregamento:

- **Next.js e drizzle-kit:** lêem `.env.local` via `@next/env`.
- **Compose:** recebe `.env.local` pelos scripts `db:up`/`db:down` (`--env-file`).
- **Imagem de produção:** não contém `.env*` (ver `.dockerignore`); os valores entram no `docker run`.
- **`NEXT_PUBLIC_*`:** não existe nenhuma; segredos nunca usam esse prefixo.

## Decisões

| Decisão                                                                             | Motivo                                                                                                                        | Alternativa                              | Revisitar quando                                                          |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Next.js + Drizzle no lugar de Express + Prisma + HTML sem build                     | Escopo da base declarado prioritário pelo usuário (2026-10-28)                                                                | Stack descrita no sistema atual          | O dono do produto pedir manter a stack antiga                             |
| PostgreSQL também em dev (sem SQLite)                                               | Mesmo motor em dev e produção; transações e tipos iguais                                                                      | SQLite local                             | Nunca para dados; talvez para um modo demo                                |
| Cliente de banco em `src/infrastructure/db` (não `src/db`)                          | Requisito "integrações em src/infrastructure"                                                                                 | Layout padrão do toolkit                 | —                                                                         |
| Pacote `cn` (shadcn) no lugar de clsx + tailwind-merge                              | O registry atual do shadcn gera `import { cn } from "cn"`; evita duas implementações                                          | clsx + tailwind-merge do template        | O pacote `cn` deixar de ser mantido                                       |
| `cn` configurado em `@ds/lib/cn` (`createCn` com as escalas do DS)                  | Sem a configuração, `cn("text-body-lg text-strong")` descarta o tamanho, lido como cor                                        | Manter nomes padrão do Tailwind          | O `cn` passar a ler o tema do CSS                                         |
| Design system em `design-system/` (alias `@ds/*`), fora de `src/`                   | Pedido explícito; agrupa tokens, componentes e referências e mantém `src/` para o app                                         | `src/components/ui` do shadcn            | —                                                                         |
| Tokens com paletas e escalas padrão do Tailwind zeradas                             | Classe fora do sistema não gera CSS; o ESLint barra hex, px e valores arbitrários                                             | Somar tokens às escalas padrão           | —                                                                         |
| Lucide no lugar do HugeIcons da referência                                          | Já instalado; evita uma segunda biblioteca de ícones                                                                          | Vendorizar os 77 SVGs do HugeIcons       | Faltar um ícone essencial no Lucide                                       |
| ESLint 9.39 (não 10)                                                                | `eslint-plugin-react`, `-import` e `-jsx-a11y` declaram peer só até ESLint 9                                                  | ESLint 10.13                             | Os plugins do `eslint-config-next` declararem ESLint 10                   |
| TypeScript 5.9 (não 7.0)                                                            | `typescript-eslint` 8.72 exige TS < 6.1                                                                                       | TS 7 nativo                              | `typescript-eslint` suportar TS 7                                         |
| `output: "standalone"` + usuário `node`                                             | Imagem enxuta, sem root, sem segredos                                                                                         | `next start` com `node_modules` completo | —                                                                         |
| Sessão em banco (token opaco, SHA-256 em `sessions.id`)                             | Revogação imediata (logout, encerrar outras sessões, usuário desativado) e ociosidade configurável; sem segredo de assinatura | JWT stateless (`jose`, removido)         | Vários servidores ou carga que torne a consulta por requisição um gargalo |
| Hash `scrypt` do `node:crypto` (N=2^17, r=8, p=1)                                   | Mínimo da OWASP para scrypt; sem dependência nativa                                                                           | argon2id (pacote nativo)                 | A OWASP elevar o mínimo ou haver pacote argon2 sem build nativo           |
| CSRF por token por sessão (hash no banco) + cookie legível + verificação de origem  | Requisito "cabeçalho anti-CSRF"; funciona em HTTP na LAN e HTTPS no túnel                                                     | Só `SameSite`                            | —                                                                         |
| Rate limit em memória (janela deslizante, até 10 mil chaves: IP, e-mail ou usuário) | Um único servidor no PC da loja                                                                                               | PostgreSQL/Redis                         | Rodar mais de uma instância                                               |
| IP do cliente por `cf-connecting-ip` ou primeiro `x-forwarded-for`                  | O Next não expõe o socket às rotas e só preenche `x-forwarded-for` quando ausente                                             | Proxy reverso próprio                    | O acesso direto pela LAN virar risco: ver a pendência em setup.md         |

## Manutenção

Atualize este mapa quando diretórios, dependências relevantes, contratos ou limites mudarem. Registre só o comportamento verificado e remova decisões que não valem mais.
