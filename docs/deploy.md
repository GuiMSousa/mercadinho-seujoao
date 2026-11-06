# Implantação em produção

Guia para colocar o Mkt Control no ar num computador da loja (Windows com Docker Desktop ou Linux com Docker Engine), com HTTPS por um Cloudflare Tunnel e backup diário do banco. O ambiente de desenvolvimento continua descrito em [onboarding.md](onboarding.md) e [setup.md](setup.md).

## Visão geral

```text
celulares, tablets e PCs ──HTTPS──> Cloudflare ──túnel de saída──> cloudflared (neste PC)
                                                                       │ http://localhost:3000
                                                    compose.prod.yaml: app (Next.js) ──> postgres (PostgreSQL 18)
```

- `compose.prod.yaml` sobe dois contêineres no projeto `mkt-control-prod`, separados do banco de desenvolvimento (`compose.yaml`):
  - `postgres`: volume próprio (`mkt-control-prod_postgres-data`);
  - `app`: imagem gerada pelo `Dockerfile` a cada `up --build`.
- As portas do app (3000) e do banco (5433) ficam presas ao `127.0.0.1`: nada fica exposto na rede local nem na internet. O acesso de fora entra só pelo túnel, que é uma conexão de saída; nenhuma porta do roteador é aberta.
- Ao iniciar, o contêiner do app aplica as migrações pendentes (`scripts/migrate.mjs`) e só então sobe o servidor. Se uma migração falhar, ele para e não atende nada.
- O Docker acompanha a saúde do app por `GET /api/health`, rota pública que faz `SELECT 1` no banco e responde `{ "status": "ok", "timestamp": "…", "db": "connected" }`. Se o banco estiver fora do ar, a resposta é 503 com `db: "disconnected"`, sem detalhes do erro.

## Pré-requisitos

- **Docker:** Docker Desktop (Windows, com WSL 2) ou Docker Engine com o plugin Compose (Linux).
- **Git,** para baixar e atualizar o código.
- **Node.js 24 e npm,** só para tarefas de manutenção feitas deste PC, como `npm run user:create`.
- **Conta Resend com domínio verificado.** Em produção, o código de cadastro, a recuperação de senha, o convite de usuários e o resumo diário dependem do e-mail. Sem a chave, esses envios são recusados.
- **Conta Cloudflare com um domínio,** para o túnel nomeado com endereço fixo (por exemplo, `caixa.sualoja.com.br`). O HTTPS também é exigido pela instalação como app (PWA) e pela câmera do celular.

## 1. Configurar

1. Baixe o código e entre na pasta:
   `git clone <repositório> mkt-control` e `cd mkt-control`.
2. Crie o arquivo de ambiente de produção a partir do modelo:
   - Windows: `Copy-Item .env.production.example .env.production`;
   - Linux: `cp .env.production.example .env.production && chmod 600 .env.production`.
3. Preencha `.env.production`:
   - `POSTGRES_PASSWORD`: longa, aleatória e só com letras e números, porque entra na URL de conexão. Gere com `openssl rand -hex 32` (Linux ou Git Bash) ou, no PowerShell 7, com `-join ([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32) | % { $_.ToString('x2') })`.
   - `RESEND_API_KEY` e `MAIL_FROM`: a chave da Resend e um remetente do domínio verificado nela.
   - `POSTGRES_PORT` e `APP_PORT`: troque só se 5433 ou 3000 já estiverem em uso neste PC.

O `.env.production` fica fora do Git e da imagem (`.gitignore` e `.dockerignore`). Não o envie por mensagem nem o guarde em nuvem pública.

## 2. Subir o sistema

```sh
docker compose -f compose.prod.yaml --env-file .env.production up -d --build
```

- A primeira vez leva alguns minutos, porque instala as dependências e compila o app dentro da imagem.
- Confira se os dois contêineres ficaram saudáveis: `docker compose -f compose.prod.yaml --env-file .env.production ps` deve mostrar `healthy`.
- Confira a rota de saúde: `curl http://127.0.0.1:3000/api/health` (no PowerShell, `Invoke-RestMethod http://127.0.0.1:3000/api/health`).
- Veja os logs: `docker compose -f compose.prod.yaml --env-file .env.production logs -f app`. A linha `Migrações em dia.` aparece antes de o servidor subir.

Os contêineres têm `restart: unless-stopped`: voltam sozinhos depois de reiniciar o PC, desde que o Docker inicie com o sistema (no Docker Desktop, ative "Start Docker Desktop when you sign in").

## 3. Primeiro acesso

- **Pelo navegador (recomendado):** abra o endereço do túnel (ou `http://127.0.0.1:3000` neste PC), entre em `/cadastro` e crie a loja e o administrador. O código de confirmação chega por e-mail, por isso a Resend precisa estar configurada.
- **Sem e-mail, ou para recuperar o acesso de um administrador,** crie o usuário a partir deste PC, apontando para o banco de produção pela porta de loopback:
  - PowerShell 7: `$env:DATABASE_URL = Read-Host -MaskInput "URL do banco"`, depois `npm run user:create -- ana@loja.com.br "Ana Souza" ADMIN`;
  - Linux (bash): `read -rsp "URL do banco: " DATABASE_URL && export DATABASE_URL`, depois `npm run user:create -- ana@loja.com.br "Ana Souza" ADMIN`.

  A URL é `postgresql://<usuário>:<senha>@127.0.0.1:5433/<banco>`, com os valores do `.env.production`. Digitada assim, ela não fica no histórico de comandos (o do PowerShell é gravado em disco).

  Antes, rode `npm ci` uma vez na pasta. A senha inicial aparece só nessa saída: guarde-a e troque-a no primeiro acesso, em Configurações. Feche o terminal depois.

## 4. HTTPS com Cloudflare Tunnel (endereço fixo)

O túnel liga este PC à Cloudflare por uma conexão de saída. A Cloudflare entrega o HTTPS com certificado válido no seu domínio e repassa as requisições para `http://localhost:3000`.

1. Na Cloudflare, adicione o domínio da loja à conta, se ainda não estiver.
2. No painel **Zero Trust**, abra **Networks → Tunnels** (em versões mais novas do painel, **Networks → Connectors**), crie um túnel do tipo **Cloudflared** e dê um nome (por exemplo, `mkt-control-loja`).
3. Instale o conector neste PC com o comando que o painel mostra. Ele já traz o token do túnel:
   - Windows (PowerShell como administrador, depois de instalar o `cloudflared` com `winget install --id Cloudflare.cloudflared`): `cloudflared.exe service install <TOKEN>`;
   - Linux (Debian/Ubuntu, pelo repositório da Cloudflare): `sudo cloudflared service install <TOKEN>`.

   O conector vira um serviço do sistema e volta sozinho após reiniciar.

4. Na aba de rotas públicas do túnel (**Public Hostname**, ou **Published application routes** nas versões mais novas), crie `caixa.sualoja.com.br` com **Service** `HTTP` e **URL** `localhost:3000`.
   - Não preencha "HTTP Host Header" nem "Origin Server Name": o login confere que a origem do navegador bate com o host da requisição, e trocar o host faria a Cloudflare repassar outro valor.
5. No domínio, desligue o que a Cloudflare injeta nas páginas: **Rocket Loader**, **Email Address Obfuscation** e o **Web Analytics** automático. A CSP do app bloqueia scripts que não vêm do próprio servidor, e esses recursos ficariam quebrados.
6. Abra `https://caixa.sualoja.com.br/api/health` e depois faça login. Pelo túnel, o app recebe `X-Forwarded-Proto: https` e grava os cookies de sessão com `Secure`.

**Cuidados:**

- O token do túnel é uma credencial. Não o coloque no Git nem em mensagens. Se vazar, gere outro no painel e reinstale o serviço.
- Sem domínio próprio, `cloudflared tunnel --url http://localhost:3000` cria um túnel rápido. Ele serve para testes, mas o endereço muda a cada execução, o que quebra o atalho do PWA.
- Para atender também a rede local por HTTP (sem câmera e sem PWA), troque a porta do app no `compose.prod.yaml` para `"3000:3000"`. Pelo túnel, o limite de tentativas de login usa o IP real (`cf-connecting-ip`). Na LAN, ele usa o `x-forwarded-for`, que o cliente pode forjar. Por isso o padrão fica preso ao `127.0.0.1`.

## 5. Backup automático

`scripts/backup-db.ps1` (Windows) e `scripts/backup-db.sh` (Linux) seguem estes passos:

1. rodam `pg_dump` dentro do contêiner do banco;
2. conferem o arquivo com `pg_restore --list`;
3. copiam o dump para `backups/<banco>-<data-hora>.dump`;
4. apagam os dumps com mais de 30 dias.

Nenhuma senha passa pelo script; ele lê só o usuário e o nome do banco do arquivo de ambiente. Em produção, aponte para o arquivo e o compose de produção.

**Rodar à mão:**

- Windows: `pwsh -NoProfile -File scripts/backup-db.ps1 -EnvFile .env.production -ComposeFile compose.prod.yaml`.
- Linux: `ENV_FILE=.env.production COMPOSE_FILE=compose.prod.yaml sh scripts/backup-db.sh`.

**Agendar no Windows (Agendador de Tarefas, todo dia às 22h30):**

```powershell
schtasks /Create /SC DAILY /ST 22:30 /TN "Mkt Control - backup" /TR "pwsh -NoProfile -File C:\mkt-control\scripts\backup-db.ps1 -EnvFile .env.production -ComposeFile compose.prod.yaml"
```

- Troque `C:\mkt-control` pela pasta do sistema; o script entra nela sozinho, então os caminhos relativos funcionam.
- A tarefa roda com o usuário logado, que é quando o Docker Desktop está no ar.
- Para testar na hora: `schtasks /Run /TN "Mkt Control - backup"`. Para ver o último resultado: `schtasks /Query /TN "Mkt Control - backup" /V /FO LIST`.

**Agendar no Linux (cron, todo dia às 22h30):** em `crontab -e`, adicione:

```cron
30 22 * * * cd /opt/mkt-control && ENV_FILE=.env.production COMPOSE_FILE=compose.prod.yaml sh scripts/backup-db.sh >> backups/backup.log 2>&1
```

**Fora deste PC:** copie a pasta `backups/` com frequência para outro disco ou para uma nuvem privada. Um backup no mesmo disco não sobrevive a uma falha dele, e os dumps têm dados pessoais e financeiros.

**Restaurar** (substitui os dados; faça com o app parado e depois de um backup novo):

```sh
docker compose -f compose.prod.yaml --env-file .env.production stop app
docker cp backups/<arquivo>.dump mkt-control-prod-postgres-1:/tmp/restore.dump
docker exec mkt-control-prod-postgres-1 pg_restore -U <usuário> -d <banco> --clean --if-exists /tmp/restore.dump
docker compose -f compose.prod.yaml --env-file .env.production start app
```

## 6. Atualizar para uma nova versão

1. Faça um backup (seção 5).
2. Baixe o código novo com `git pull`.
3. Rode de novo `docker compose -f compose.prod.yaml --env-file .env.production up -d --build`. A imagem é recompilada e, ao iniciar, o app aplica as migrações novas.
4. Confira `/api/health` e faça um login.

## 7. Monitoramento e solução de problemas

- **Monitor externo:** aponte um serviço de uptime para `https://caixa.sualoja.com.br/api/health`. Ele responde 200 quando app e banco estão bem, e 503 quando o banco caiu.
- **App `unhealthy` ou reiniciando:** veja `docker compose -f compose.prod.yaml --env-file .env.production logs app`. Uma falha de migração aparece antes da linha do Next.js.
- **"Acesso negado" no login pelo túnel:** confira se o hostname público não troca o cabeçalho Host (seção 4, passo 4).
- **E-mail não chega:** confira `RESEND_API_KEY` e se o domínio de `MAIL_FROM` está verificado na Resend. Os erros de envio vão para o log do app.
- **Porta em uso:** troque `APP_PORT` ou `POSTGRES_PORT` no `.env.production` e aponte o túnel para a nova porta do app.

## Segurança em produção

- **Cabeçalhos em todas as respostas** (`next.config.ts`):
  - `X-Frame-Options: DENY`;
  - `X-Content-Type-Options: nosniff`;
  - `Referrer-Policy: same-origin`, mais restritivo que `strict-origin-when-cross-origin`: links para outros sites, como o WhatsApp, não levam endereço nenhum da loja.
- **CSP com nonce nas páginas** (`src/proxy.ts` e `src/lib/csp.ts`):
  - scripts só deste servidor e só com o nonce da resposta (`'strict-dynamic'`), sem `eval`;
  - sem objetos, sem formulários para outros sites e sem ser exibido dentro de frames;
  - estilos aceitam `'unsafe-inline'`, porque o React grava atributos `style` no HTML;
  - não há `upgrade-insecure-requests`, para não quebrar o acesso por HTTP na rede local.
- **Contêiner do app:** roda como o usuário `node`, sem privilégios. A imagem não leva `.env*`, `backups/` nem o histórico do Git.
- **`/api/health` público:** cada chamada faz um `SELECT 1` no banco. Para que ninguém o chame em excesso pela internet, crie na Cloudflare uma regra de limite de requisições para esse caminho (por exemplo, 30 por minuto por IP).
