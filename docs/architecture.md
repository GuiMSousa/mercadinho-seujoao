# Código e arquitetura

## Stack real

| Área             | Escolha                                                                       | Versão                                |
| ---------------- | ----------------------------------------------------------------------------- | ------------------------------------- |
| Runtime          | Node.js LTS (`.nvmrc`, `engines`, Docker `node:24-alpine`, CI)                | 24.x (local 24.22.1)                  |
| Gerenciador      | npm com `package-lock.json` (`packageManager: npm@11.19.1`)                   | 11.19.1                               |
| Framework        | Next.js App Router, Turbopack, saída `standalone`                             | 16.4.3                                |
| UI               | React, Tailwind CSS (`@tailwindcss/turbopack`), shadcn/ui `base-nova`, Lucide | 19.3.1 / 4.3.3 / CLI 4.23.0 / 1.62.0  |
| Linguagem        | TypeScript estrito                                                            | 5.9.3                                 |
| Dados            | Drizzle ORM + `pg`; drizzle-kit                                               | 0.45.4 / 8.23.1 / 0.31.11             |
| Banco            | PostgreSQL em Docker Compose                                                  | 18 (`postgres:18-alpine`, local 18.6) |
| Validação e logs | Zod, Pino                                                                     | 4.6.7 / 10.4.0                        |
| Testes           | Vitest (Node)                                                                 | 5.0.5                                 |

As versões exatas estão no lockfile. As razões de cada escolha estão em [setup.md](setup.md).

## Mapa do código

```text
src/
├── proxy.ts                  # gate otimista (Next 16 "proxy", ex-middleware): mesma regra das rotas
├── app/
│   ├── layout.tsx, page.tsx  # layout pt-BR e página inicial
│   ├── login/                # tela de login (form cliente → POST /api/auth/login)
│   └── api/
│       ├── _lib/guard.ts     # adaptador HTTP: lê a sessão, aplica accessDenial, define/limpa cookies
│       ├── auth/login, auth/logout
│       └── admin/users       # exclusiva de ADMIN
├── components/ui/            # shadcn: button, input, label (texto 16 px)
├── contracts/
│   ├── auth.ts               # schemas Zod da API + nomes de cookie/cabeçalho
│   ├── openapi.ts            # monta o OpenAPI 3.1 a partir dos schemas
│   └── openapi.json          # contrato versionado (npm run spec:generate)
├── domains/auth/
│   ├── access.ts             # regra única de acesso (público, sessão, ADMIN, CSRF, origem)
│   ├── session.ts            # JWT HS256 (jose) com claims validadas por Zod
│   ├── password.ts           # hash scrypt (node:crypto)
│   ├── login-rate-limit.ts   # janela deslizante em memória + IP do cliente
│   ├── service.ts            # authenticate (tempo constante para usuário inexistente)
│   └── repository.ts         # único acesso a `users`
├── lib/                      # env (Zod, server-only), logger Pino, `cn`
└── infrastructure/db/
    ├── index.ts              # único ponto de conexão: pool limitado (max 5), lazy
    └── schema/               # users.ts (enum user_role + tabela users)
drizzle/                      # SQL versionado (0000: user_role + users)
scripts/                      # create-user.mts, generate-openapi.mts, verify-quality-rules.mjs
eslint-rules/                 # regras locais do toolkit
```

Os testes ficam junto do código (`*.test.ts`) e não precisam de banco.

## Limites e fluxo

```text
src/app/api/<rota> (fina) ──> src/domains/<feature>/service ──> repository ──> src/infrastructure/db
        │      └── guard() = accessDenial() ◄── src/proxy.ts usa a mesma regra
        └── valida entrada/saída com src/contracts (Zod) ──> openapi.json
```

- **`src/domains/<feature>`:** regra de negócio. Os services não importam `next/*`. Só os repositories chamam `getDb()`.
- **`src/infrastructure`:** integrações. Hoje só o banco; e-mail (Resend) entra com o alerta diário.
- **`src/contracts`:** schemas Zod da API e o OpenAPI gerado deles.
- **Rotas:** começam com `guard(request)` e só depois validam a entrada, chamam o service e devolvem DTOs parseados pelo contrato.

**Autenticação** (`/api/auth/login`):

1. **Origem:** requisição de outra origem → 403.
2. **Limite por IP:** 10 tentativas a cada 15 minutos; a 11ª → 429 com `Retry-After`.
3. **Entrada:** validada com Zod; usuário convertido para minúsculas.
4. **Senha:** conferida com scrypt, também quando o usuário não existe (não revela quais usuários existem).
5. **Sessão:** JWT HS256 de 12 h com `sub`, `username`, `role` e `csrf`, no cookie `mkt_session` (HTTP-only, `SameSite=Lax`, `Secure` sob HTTPS).
6. **CSRF:** o mesmo token vai no cookie legível `mkt_csrf` e na resposta.

**Acesso** (`accessDenial`, usado pelo proxy e por cada rota):

- `/`, `/login` e o login são públicos; qualquer outro caminho exige sessão (padrão seguro).
- `/admin` e `/api/admin` exigem `ADMIN`.
- Métodos que alteram estado exigem `x-csrf-token` igual ao claim `csrf` e mesma origem.
- O proxy redireciona páginas sem sessão para `/login`.

Pastas novas só nascem com código real.

Guardas automáticas atuais (ESLint):

- `quality/no-direct-data-access` impede importar `getDb`/`db` de `@/infrastructure/db` em `src/app`, `src/components` e arquivos `.tsx`.
- `drizzle/enforce-delete-with-where` e `drizzle/enforce-update-with-where` exigem `where`.
- `quality/no-direct-console` aponta o logger.
- `quality/max-lines` limita arquivos a 350 linhas.

## Dados e migrations

- **Schema:** `src/infrastructure/db/schema/` (re-exportado por `index.ts`). Hoje: enum `user_role` (`ADMIN`, `CASHIER`) e tabela `users` (`id` uuid com `gen_random_uuid()`, `username` único sempre em minúsculas, `password_hash` no formato `scrypt$N$r$p$salt$hash`, `role`, `created_at`). As próximas tabelas virão do PRODUCT.md, fluxo a fluxo.
- **SQL versionado:** `drizzle/0000_needy_nightcrawler.sql` (cria `user_role` e `users`). Gerar não exige conexão.
- **Aplicação:** `npm run db:migrate` usa `DATABASE_URL_UNPOOLED` ou `DATABASE_URL`, só no destino autorizado. Nunca durante build, import ou requisição. Sem `db:push` no fluxo padrão.
- **Conexão:** `getDb()` valida a URL com Zod e cria o pool só no primeiro uso. Por isso `lint`, `test` e `build` funcionam sem credenciais. `closeDatabase()` existe só para encerramento controlado e testes.
- **Transações:** obrigatórias em vendas (baixa PVPS de vários lotes, CMV e pagamento) e no caixa. O driver `pg` as suporta.
- **Dinheiro:** centavos inteiros; peso em gramas.

## Ambiente

| Variável                                                             | Onde                                | Uso                                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                       | runtime (app, drizzle-kit, scripts) | Conexão PostgreSQL. Não é necessária no build                                                                    |
| `DATABASE_URL_UNPOOLED`                                              | migrations (opcional)               | Conexão direta, se o provedor exigir                                                                             |
| `LOG_LEVEL`                                                          | runtime                             | Nível do Pino (padrão `info`)                                                                                    |
| `SESSION_SECRET`                                                     | runtime (app, proxy)                | Chave HS256 das sessões, 32+ caracteres aleatórios. Não é necessária no build; trocá-la encerra todas as sessões |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Docker Compose                      | Credenciais do container local                                                                                   |

Carregamento:

- **Next.js e drizzle-kit:** lêem `.env.local` via `@next/env`.
- **Compose:** recebe `.env.local` pelos scripts `db:up`/`db:down` (`--env-file`).
- **Imagem de produção:** não contém `.env*` (ver `.dockerignore`); os valores entram no `docker run`.
- **`NEXT_PUBLIC_*`:** não existe nenhuma; segredos nunca usam esse prefixo.

## Decisões

| Decisão                                                            | Motivo                                                                                                               | Alternativa                              | Revisitar quando                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| Next.js + Drizzle no lugar de Express + Prisma + HTML sem build    | Escopo da base declarado prioritário pelo usuário (2026-10-28)                                                       | Stack descrita no sistema atual          | O dono do produto pedir manter a stack antiga                     |
| PostgreSQL também em dev (sem SQLite)                              | Mesmo motor em dev e produção; transações e tipos iguais                                                             | SQLite local                             | Nunca para dados; talvez para um modo demo                        |
| Cliente de banco em `src/infrastructure/db` (não `src/db`)         | Requisito "integrações em src/infrastructure"                                                                        | Layout padrão do toolkit                 | —                                                                 |
| Pacote `cn` (shadcn) no lugar de clsx + tailwind-merge             | O registry atual do shadcn gera `import { cn } from "cn"`; evita duas implementações                                 | clsx + tailwind-merge do template        | O pacote `cn` deixar de ser mantido                               |
| ESLint 9.39 (não 10)                                               | `eslint-plugin-react`, `-import` e `-jsx-a11y` declaram peer só até ESLint 9                                         | ESLint 10.13                             | Os plugins do `eslint-config-next` declararem ESLint 10           |
| TypeScript 5.9 (não 7.0)                                           | `typescript-eslint` 8.72 exige TS < 6.1                                                                              | TS 7 nativo                              | `typescript-eslint` suportar TS 7                                 |
| `output: "standalone"` + usuário `node`                            | Imagem enxuta, sem root, sem segredos                                                                                | `next start` com `node_modules` completo | —                                                                 |
| Sessão stateless em JWT HS256 com `jose`                           | Padrão do guia oficial de autenticação do Next.js 16 (doc em `node_modules/next/dist/docs`); evita JWT escrito à mão | Sessão em banco                          | Precisar revogar sessões individuais antes de expirarem           |
| Hash `scrypt` do `node:crypto` (N=2^17, r=8, p=1)                  | Mínimo da OWASP para scrypt; sem dependência nativa                                                                  | argon2id (pacote nativo)                 | A OWASP elevar o mínimo ou haver pacote argon2 sem build nativo   |
| CSRF por token no JWT + cookie legível + verificação de origem     | Requisito "cabeçalho anti-CSRF"; funciona em HTTP na LAN e HTTPS no túnel                                            | Só `SameSite`                            | —                                                                 |
| Rate limit em memória (janela deslizante, até 10 mil IPs)          | Um único servidor no PC da loja                                                                                      | PostgreSQL/Redis                         | Rodar mais de uma instância                                       |
| IP do cliente por `cf-connecting-ip` ou primeiro `x-forwarded-for` | O Next não expõe o socket às rotas e só preenche `x-forwarded-for` quando ausente                                    | Proxy reverso próprio                    | O acesso direto pela LAN virar risco: ver a pendência em setup.md |

## Manutenção

Atualize este mapa quando diretórios, dependências relevantes, contratos ou limites mudarem. Registre só o comportamento verificado e remova decisões que não valem mais.
