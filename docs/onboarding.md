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
npm run db:seed   # só desenvolvimento: loja e usuários de demonstração
npm run dev
```

Abra `http://localhost:3000/login`. Há três caminhos para o primeiro acesso:

- **Demonstração (só em desenvolvimento):** `npm run db:seed` cria a loja "Mercadinho Bom Preço" e três usuários, todos com a senha `mkt12345`: `ana@bompreco.com.br` (`ADMIN`), `carlos@bompreco.com.br` e `juliana@bompreco.com.br` (`CASHIER`). O seed recusa `NODE_ENV=production`, lê só o env de desenvolvimento (nunca `.env.production*`), recusa (código de saída 1) um banco que já tenha uma loja diferente da de demonstração ou algum usuário fora dos três da lista, é idempotente e nunca sobrescreve uma loja nem a senha de um usuário que já exista (ele lista o que ignorou). Os botões "Administrador" e "Operador de caixa" da tela de login só aparecem em desenvolvimento. O painel é exclusivo de `ADMIN`: o login de `CASHIER` é recusado.
- **Instalação real:** com o banco vazio, `/` leva a `/login`, onde "Criar conta da loja" abre o cadastro em 3 etapas (dados da conta, dados da loja, código de 6 dígitos por e-mail). Quem cria a loja vira `ADMIN`; depois disso o botão some. Os demais usuários entram por convite em Usuários.
- **Linha de comando:** `npm run user:create -- <email> "<Nome completo>" <ADMIN|CASHIER>` cria um usuário com senha aleatória, exibida uma única vez; guarde-a em local seguro. E-mails repetidos são recusados. Use-o só para usuários extras: ele não cria a loja, e sem loja a página Configurações apenas orienta a cadastrá-la. Para o primeiro usuário, prefira "Criar conta da loja" (instalação real) ou `npm run db:seed` (desenvolvimento).

No `.env.local` (ignorado pelo Git), defina:

- `POSTGRES_USER`, `POSTGRES_DB` e `POSTGRES_PASSWORD`, usando uma senha longa e aleatória gerada localmente;
- `POSTGRES_PORT` (padrão 5432);
- `DATABASE_URL=postgresql://<user>:<senha>@localhost:<porta>/<db>`, com os mesmos valores. A senha aparece nos dois lugares, então troque nos dois.
- `DATABASE_URL_TEST`: mesma conexão, mas com o banco `mkt_control_test` (ver "Banco de testes" abaixo).
- Variáveis de e-mail: opcionais em desenvolvimento (ver "E-mail" abaixo).

Nunca use `NEXT_PUBLIC_*` para segredos.

### E-mail

Sem `RESEND_API_KEY`, fora de produção, o servidor não envia nada: o texto de cada e-mail (códigos de cadastro, recuperação e convite) aparece no log do `npm run dev` com a mensagem `mail (dev)`. Em produção a chave é obrigatória. No `.env.local`, `RESEND_API_KEY` é a chave da conta Resend e `MAIL_FROM` é o remetente, por exemplo `Mkt Control <no-reply@seudominio.com.br>` (padrão fora de produção: `Mkt Control <no-reply@localhost>`).

O npm 11 bloqueia install scripts não aprovados (`allowScripts`). Os avisos sobre `esbuild` e `unrs-resolver` no `npm ci` são esperados: lint, testes, build e drizzle-kit funcionam sem esses scripts. Não aprove scripts sem revisar.

## Operação

- **Cadastre a loja antes de ligar o túnel:** enquanto não há loja, qualquer pessoa que alcance o servidor pode criar a conta da loja e virar `ADMIN`.
- **Use a LAN apenas em rede confiável (HTTP):** o acesso pela rede local trafega sem TLS, e os cabeçalhos de IP são controlados pelo cliente; por isso o login também é limitado por conta (20 tentativas a cada 15 minutos).
- **Limites de código:** no máximo 10 códigos por e-mail e finalidade em 24 h (cadastro e recuperação); convites de um `ADMIN` ficam fora dessa conta.

## Banco de dados

- `npm run db:up` sobe `postgres:18-alpine` (`compose.yaml`) e espera o healthcheck. A porta fica só no loopback (`127.0.0.1`) e os dados no volume `mkt-control_postgres-data`.
- `npm run db:down` para e remove o container, mantendo o volume. Apagar o volume (`docker volume rm mkt-control_postgres-data`) destrói os dados locais.
- Rode o Compose sempre pelos scripts, ou passe `--env-file .env.local`. Sem ele, o Compose recusa iniciar por falta de `POSTGRES_*`.
- **Migrations** (a `0000` cria `user_role` e `users`; a `0001` adiciona loja, sessões, códigos de verificação e log de atividade, e troca `username` por `name`/`email`):
  1. `npm run db:generate` gera o SQL em `drizzle/` sem conectar.
  2. Revise o diff.
  3. `npm run db:migrate` aplica no banco de `DATABASE_URL_UNPOOLED`/`DATABASE_URL`.

  Nunca use produção como ambiente de teste.

- **A migration `0001` apaga todos os usuários** (`DELETE FROM "users"`), porque o `username` antigo não vira e-mail. Em desenvolvimento, recrie-os com `npm run db:seed` (cria a loja e os usuários de demonstração) ou, se a loja já existe, com `npm run user:create -- <email> "<Nome completo>" ADMIN`. Não aplique a `0001` num banco cujos usuários precisem ser mantidos.

- **A migration `0002` falha de propósito** (e não altera nada) se houver e-mails de usuários que diferem só por maiúsculas/minúsculas (o `UPDATE` que os põe em minúsculas viola o `UNIQUE`) ou mais de uma linha em `stores` com `singleton = false` e outra com `true`. Antes de migrar, confira com `SELECT lower(email), count(*) FROM users GROUP BY 1 HAVING count(*) > 1;` e `SELECT count(*) FROM stores;`. Remova ou renomeie os e-mails duplicados e deixe uma única loja. A `0002` também apaga sessões sem hash CSRF (só desconecta esses usuários).

### Banco de testes

Os testes com banco real (`*.db.test.ts`) usam o banco `mkt_control_test`, no mesmo servidor, e rodam cada teste numa transação que sofre rollback. Preparação, uma vez:

```bash
docker compose --env-file .env.local exec postgres sh -c 'createdb -U "$POSTGRES_USER" mkt_control_test'
```

Depois defina `DATABASE_URL_TEST` no `.env.local` (mesmas credenciais, banco `mkt_control_test`) e aplique as migrations nele com `npm run db:migrate:test`. Repita `db:migrate:test` sempre que houver migration nova.

### Banco do teste em navegador

O roteiro E2E de [quality.md](quality.md#roteiro-e2e-no-navegador) roda contra um banco descartável `mkt_control_e2e`, no mesmo servidor, para começar sempre do zero (sem loja e sem usuários). Crie-o uma vez (`createdb`, como acima), aplique as migrations com `DATABASE_URL` e `DATABASE_URL_UNPOOLED` apontando para ele (`npx drizzle-kit migrate`) e suba o app com `DATABASE_URL` apontando para ele: `npm run dev -- -p 3100`. Os códigos são lidos do log do servidor. Depois, rode `npm run db:seed` no banco de desenvolvimento.

## Verificar

- `npm run check` roda formatação, lint, tipos, lint tipado, autoteste das regras, testes, contrato OpenAPI (`spec:check`) e build. Não precisa de banco nem de credenciais; é o mesmo conjunto do GitHub Actions.
- `npm run test:db` roda os testes com banco real (`*.db.test.ts`). Precisa de `npm run db:up`, do banco `mkt_control_test` migrado e de `DATABASE_URL_TEST`. Não faz parte do `npm run check`; o GitHub Actions roda os dois, com um serviço `postgres:18-alpine`.

## Agentes

Leia [AGENTS.md](../AGENTS.md). [CLAUDE.md](../CLAUDE.md) importa as mesmas instruções. Skills locais, integrações e escopos estão em [setup.md](setup.md).

## Problemas conhecidos

| Sintoma                                                                                                                     | Causa verificada                                                                                                                                 | Correção verificada                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No Bash do Claude Code, todo `cd` falha com `We can't find the necessary environment variables to replace the Node version` | O snapshot do shell do Claude Code captura o hook `cd` do fnm (`--use-on-cd`), mas não as variáveis dele                                         | O bloco do fnm no `~/.bashrc` é pulado quando `CLAUDECODE` está definido. Vale em sessões novas; numa sessão aberta antes da correção, use `builtin cd`                             |
| `docker compose ...` falha com `set POSTGRES_USER in .env.local`                                                            | Compose rodado sem `--env-file .env.local`                                                                                                       | Use `npm run db:up` / `npm run db:down`                                                                                                                                             |
| Em `npm run dev` acessado pelo IP da rede, o login volta para `/login` com usuário e senha na URL                           | O Next 16 bloqueia (403) os chunks JS e o HMR do dev pedidos por hostnames não permitidos; sem JS a página não hidrata e o form fazia GET nativo | `allowedDevOrigins` no `next.config.ts` com o IP da máquina (atualize se o DHCP trocar o IP) e form com `method="post"` para `/api/auth/login`, para nunca expor credenciais na URL |
