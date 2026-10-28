# Preparação local

## Pré-requisitos

| Ferramenta     | Versão                               | Como conferir                                                         |
| -------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Node.js        | 24.x (`.nvmrc`; `engines: >=24 <25`) | `node -v`. Com fnm, a versão do `.nvmrc` é ativada ao entrar na pasta |
| npm            | 11.x (vem com o Node 24)             | `npm -v`                                                              |
| Docker Desktop | com Docker Compose v2+               | `docker compose version` e `docker info`                              |
| Git            | qualquer versão recente              | `git --version`                                                       |

Reutilize as instalações globais da máquina; nada aqui exige instalação global extra. `agent-browser` só é necessário para a skill `next-dev-loop` (ver [setup.md](setup.md)).

## Primeira execução

```bash
npm ci
cp .env.example .env.local
npm run db:up
npm run db:migrate
npm run user:create -- <seu-usuario> ADMIN
npm run dev
```

Abra `http://localhost:3000/login`. O `user:create` mostra a senha inicial uma única vez; guarde-a em local seguro. Para operadores, use `CASHIER`. Usuários com o mesmo nome são recusados.

No `.env.local` (ignorado pelo Git), defina:

- `POSTGRES_USER`, `POSTGRES_DB` e `POSTGRES_PASSWORD`, usando uma senha longa e aleatória gerada localmente;
- `POSTGRES_PORT` (padrão 5432);
- `DATABASE_URL=postgresql://<user>:<senha>@localhost:<porta>/<db>`, com os mesmos valores. A senha aparece nos dois lugares, então troque nos dois.
- `SESSION_SECRET`: 32+ caracteres aleatórios. O comando está no `.env.example`. Trocar esse valor desconecta todos os usuários.

Nunca use `NEXT_PUBLIC_*` para segredos.

O npm 11 bloqueia install scripts não aprovados (`allowScripts`). Os avisos sobre `esbuild` e `unrs-resolver` no `npm ci` são esperados: lint, testes, build e drizzle-kit funcionam sem esses scripts. Não aprove scripts sem revisar.

## Banco de dados

- `npm run db:up` sobe `postgres:18-alpine` (`compose.yaml`) e espera o healthcheck. A porta fica só no loopback (`127.0.0.1`) e os dados no volume `mkt-control_postgres-data`.
- `npm run db:down` para e remove o container, mantendo o volume. Apagar o volume (`docker volume rm mkt-control_postgres-data`) destrói os dados locais.
- Rode o Compose sempre pelos scripts, ou passe `--env-file .env.local`. Sem ele, o Compose recusa iniciar por falta de `POSTGRES_*`.
- **Migrations** (a `0000` cria `user_role` e `users`):
  1. `npm run db:generate` gera o SQL em `drizzle/` sem conectar.
  2. Revise o diff.
  3. `npm run db:migrate` aplica no banco de `DATABASE_URL_UNPOOLED`/`DATABASE_URL`.

  Nunca use produção como ambiente de teste.

## Verificar

- `npm run check` roda formatação, lint, tipos, lint tipado, autoteste das regras, testes, contrato OpenAPI (`spec:check`) e build. Não precisa de banco nem de credenciais; é o mesmo conjunto do GitHub Actions.
- Testes com banco real ainda não existem; quando existirem, precisam de `npm run db:up` antes.

## Agentes

Leia [AGENTS.md](../AGENTS.md). [CLAUDE.md](../CLAUDE.md) importa as mesmas instruções. Skills locais, integrações e escopos estão em [setup.md](setup.md).

## Problemas conhecidos

| Sintoma                                                                                                                     | Causa verificada                                                                                         | Correção verificada                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No Bash do Claude Code, todo `cd` falha com `We can't find the necessary environment variables to replace the Node version` | O snapshot do shell do Claude Code captura o hook `cd` do fnm (`--use-on-cd`), mas não as variáveis dele | O bloco do fnm no `~/.bashrc` é pulado quando `CLAUDECODE` está definido. Vale em sessões novas; numa sessão aberta antes da correção, use `builtin cd` |
| `docker compose ...` falha com `set POSTGRES_USER in .env.local`                                                            | Compose rodado sem `--env-file .env.local`                                                               | Use `npm run db:up` / `npm run db:down`                                                                                                                 |
