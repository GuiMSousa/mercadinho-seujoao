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
│   ├── layout.tsx, page.tsx, theme.ts # layout pt-BR (tema lido do cookie no servidor); `/` mostra a landing pública; com sessão, `ADMIN` vai para /painel e `CASHIER` para /caixa
│   ├── _landing/             # landing pública: seções estáticas e ilhas cliente (rotator, perfis, troco)
│   ├── (auth)/               # telas públicas: login/, cadastro/ (3 etapas), recuperar/ (também define a senha do convite)
│   ├── caixa/                # frente de caixa (PDV), aberta aos dois perfis: abertura do caixa, busca/leitor, carrinho, pagamento,
│   │                         # comprovante, sangria, suprimento e fechamento cego
│   ├── painel/               # shell do ADMIN: layout (guarda de perfil), _shell/ (sidebar, topbar, drawer móvel), page.tsx (saudação)
│   │   ├── produtos/         # catálogo: lista paginada com busca, diálogos de produto e categoria
│   │   ├── estoque/          # lotes por produto com o semáforo e os diálogos de entrada de lote e de baixa
│   │   ├── caixa/            # histórico e conciliação dos caixas: esperado, contado, quebra e movimentações
│   │   ├── relatorios/       # relatório financeiro: período, DRE resumida, formas de pagamento, ranking e vendas
│   │   ├── fornecedores/     # cadastro, busca, edição e inativação de fornecedores
│   │   └── estoque/reposicao # sugestão de compra por fornecedor padrão e pedido por WhatsApp (order-text.ts)
│   │   ├── usuarios/         # abas Equipe (convites, perfil, desativar) e Registro de atividade
│   │   └── configuracoes/    # dados da loja, tema, inatividade da sessão, alterar senha, encerrar outras sessões
│   ├── design-system/        # vitrine pública: componentes, estados e temas (dados fictícios)
│   └── api/
│       ├── _lib/guard.ts     # adaptador HTTP: lê a sessão, aplica accessDenial, define/limpa cookies
│       ├── _lib/public.ts    # rotas públicas: guard + limite por IP + validação (422 com `fields`) + sessão
│       ├── _lib/session-route.ts # rotas com sessão: guard + CSRF + validação; só os prefixos de ADMIN restringem o perfil
│       ├── setup, theme      # GET público `{ hasStore }`; POST do cookie de tema
│       ├── auth/login, auth/logout
│       ├── auth/signup, signup/verify, signup/resend
│       ├── auth/password-reset, password-reset/confirm
│       ├── account, account/password, account/sessions/revoke-others
│       ├── store             # dados e inatividade da loja (GET/PATCH)
│       ├── products, products/search # busca por código de barras e por nome para qualquer sessão, sem custo
│       ├── sales             # registra a venda e dá baixa PVPS, para qualquer sessão
│       ├── cash/open, cash/movements, cash/close # caixa diário, para qualquer sessão; nunca devolvem o esperado
│       └── admin/users, admin/users/[id], admin/activity, admin/categories, admin/products, admin/products/[id],
│                             # admin/products/[id]/batches, admin/inventory, admin/inventory/out, admin/cash-sessions,
│                             # admin/reports, admin/reports/sales, admin/reports/daily-email,
│                             # admin/suppliers, admin/suppliers/[id], admin/inventory/replenishment
├── contracts/                # schemas Zod por área (auth, users, store, account, activity, theme, inventory, sales, cash, reports, suppliers) + openapi*.ts
│   └── openapi.json          # contrato versionado (npm run spec:generate)
├── domains/
│   ├── auth/                 # access.ts (regra única de acesso), sessions*.ts (sessões no banco), password.ts (scrypt),
│   │                         # login-rate-limit.ts, service.ts (authenticate), signup.ts, password-reset.ts,
│   │                         # codes.ts + verification*.ts (códigos por e-mail), repository.ts (único acesso a `users` no login)
│   ├── store/                # `stores`: uma loja por instalação; criação com o primeiro ADMIN (transação) e configurações
│   ├── users/                # equipe: listar, convidar, editar, desativar (último ADMIN protegido por transação com lock)
│   ├── inventory/            # catálogo e estoque: pvps.ts (alocação pura), semaphore.ts (semáforo), repository.ts,
│   │                         # stock-repository.ts (baixa PVPS com lock, usada pela baixa manual e pela venda), service.ts
│   ├── sales/                # venda: caixa aberto, preços e custo do catálogo, baixa PVPS de todos os itens numa transação, id do cliente
│   ├── cash/                 # caixa diário: abertura única, sangria/suprimento, fechamento cego, esperado (expected.ts) e relatório
│   ├── reports/              # relatórios: period.ts (períodos), finance.ts (margem, ticket), consultas no fuso da loja, resumo por e-mail
│   ├── suppliers/            # fornecedores, fornecedor padrão do produto e reposição (replenishment.ts: sugestão e grupos)
│   ├── customers/            # clientes do fiado: cadastro, extrato, cobrança na venda e quitação por UPDATE condicional
│   └── activity/             # registro de atividade (quem fez o quê)
├── lib/                      # env (Zod, server-only), logger Pino, `cn`, `document.ts` (máscara e dígitos de CPF/CNPJ), `barcode-scale.ts` (etiqueta de balança EAN-13 `20`/`21`)
└── infrastructure/
    ├── db/                   # index.ts: único ponto de conexão (pool max 5, lazy); schema/ (users, stores, sessions,
    │                         # verification-codes, activity-log, inventory, sales, cash); test-db.ts (`withTestDb`: transação com rollback; `withTestPool`: commit e limpeza)
    └── mail/                 # Resend por `fetch`; sem chave e fora de produção, só registra no log ("mail (dev)")
drizzle/                      # SQL versionado (0000: user_role + users; 0001_auth_foundation: loja, sessões, códigos, atividade; 0002: `csrf_hash` NOT NULL, CHECKs de e-mail em minúsculas e de `singleton`, índice de códigos por e-mail, finalidade e data; 0003 e 0004: catálogo e estoque; 0005: vendas; 0006: caixa diário; 0007: fornecedores e `operation_id` das movimentações; 0008: clientes, extrato, `sale_payments`, `customer_id` e `discount_amount` nas vendas, com cópia da forma de pagamento de cada venda antiga para `sale_payments`; 0009: remove `sales.payment_method`)
public/                       # manifest.json, sw.js e icons/ do PWA
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
4. **Senha:** conferida com scrypt, também quando o usuário não existe (não revela quais usuários existem). Só depois da senha certa aparece "acesso desativado" (403). O perfil só decide a tela de chegada (`homePath`): `ADMIN` vai para `/painel` e `CASHIER` para `/caixa`.
5. **Sessão:** token aleatório de 32 bytes no cookie `mkt_session` (HTTP-only, `SameSite=Lax`, `Secure` sob HTTPS); o banco guarda só o SHA-256 em `sessions.id`. Sem "manter conectado" o cookie é de navegador e a sessão dura 12 h; com ele, 30 dias deslizantes (o proxy renova os cookies com `Max-Age` de 30 dias quando a sessão desliza). Um login com sessão já aberta encerra a anterior. A inatividade segue `stores.sessionIdle` (padrão 8 h) e usuário inativo perde a sessão.
6. **CSRF:** token aleatório por sessão, guardado como SHA-256 em `sessions.csrfHash`, enviado no cookie legível `mkt_csrf` e na resposta.

**Acesso** (`accessDenial`, usado pelo proxy e por cada rota):

- Públicos: `/`, `/login`, `/cadastro`, `/recuperar`, `/design-system`, `/api/setup`, `/api/theme` e as rotas de `/api/auth` de entrada (login, cadastro, recuperação); qualquer outro caminho exige sessão (padrão seguro).
- `/painel`, `/api/admin`, `/api/account` e `/api/store` exigem `ADMIN`. `/caixa`, `/api/sales`, `/api/products*`, `/api/customers` (busca do fiado, sem documento nem telefone) e `/api/cash/*` aceitam os dois perfis.
- Métodos que alteram estado exigem `x-csrf-token` cujo SHA-256 seja igual a `sessions.csrfHash` e mesma origem.
- O proxy redireciona páginas sem sessão para `/login`; em `/`, quem tem sessão vai para a sua tela e os visitantes veem a landing pública. Um `CASHIER` que abre uma página do painel vai para `/caixa`; nas rotas de API continua recebendo 403.
- `/manifest.json`, `/sw.js` e `/icons/*` passam direto: o matcher do proxy ignora caminhos com extensão.
- **PWA:** o Service Worker é registrado só em produção e guarda apenas `/_next/static/`, cujos nomes mudam com o conteúdo, com limite de 200 arquivos. HTML e API sempre vão à rede, porque carregam dados de sessão e preços. O navegador só o aceita em HTTPS ou `localhost`; em HTTP pela rede local a recusa é silenciosa e o sistema funciona igual.

**Códigos por e-mail** (cadastro e recuperação): 6 dígitos, hash scrypt, 10 min, 5 tentativas, novo código invalida o anterior, 1 pedido por minuto e no máximo 10 códigos por e-mail e finalidade em 24 h (acima disso, 429 no cadastro; a recuperação segue respondendo 202 e não envia nada; convites criados por um ADMIN não passam por essa checagem). A tentativa é gasta num `UPDATE ... attempts + 1` condicional antes de comparar o hash, então palpites paralelos não passam de 5. A recuperação responde 202 igual para qualquer e-mail, envia o código fora do caminho da resposta e usa uma única mensagem para todo erro de código. O pedido de cadastro fica preso ao navegador que o iniciou: o payload guarda o SHA-256 de um nonce entregue no cookie HTTP-only `mkt_signup` (`Path=/api/auth/signup`, 10 min); `verify` e `resend` exigem o cookie (409 "Seu cadastro expirou. Comece de novo."), então ninguém substitui o pedido de outra pessoa. O código novo só invalida os anteriores (apenas os criados antes dele, então o mais novo sempre sobrevive) depois que o e-mail é enviado; o payload (hash da senha e do nonce) é apagado quando o código é usado ou substituído. Trocar a senha em Configurações também consome os códigos de recuperação abertos do e-mail, na mesma transação. As respostas levam `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` e `Referrer-Policy: same-origin` (`next.config.ts`). Toda página do painel que lê dados chama `requireAdmin()`, porque layouts não rodam de novo na navegação do cliente. O cadastro cria loja e ADMIN numa transação; a segunda loja falha em `stores_singleton` e vira 409.

**Painel** (`/painel`, só `ADMIN`):

- O `layout.tsx` confere sessão e perfil no servidor (o proxy é só o primeiro filtro) e monta sidebar, topbar e, abaixo de 900 px, um drawer com foco preso.
- As páginas de Usuários e Configurações carregam os dados no servidor e mudam por `fetch` às rotas de `/api/admin`, `/api/account` e `/api/store`, com o token CSRF. Avisos usam o `Toast` do design system.
- Rebaixar ou desativar o último `ADMIN` ativo, inclusive a si mesmo, responde 409.
- O tema (claro, escuro, sistema) fica no cookie `mkt_theme`, gravado por `POST /api/theme` e aplicado ao `<html data-theme>` no servidor, sem piscar na hidratação.
- Alterar a senha encerra as outras sessões do usuário; "Encerrar outras sessões" faz só isso.

**Frente de caixa** (`/caixa`, os dois perfis):

- A página lê a sessão no servidor e passa o nome da loja e do operador ao cliente; o `ADMIN` tem um atalho para o painel.
- O campo de busca recebe o leitor USB (teclado): o Enter do leitor consulta `GET /api/products?barcode=` e nunca envia outro formulário. Teclas digitadas com o foco num botão vão para a busca, para o Enter do leitor não virar clique. Por nome, `GET /api/products/search?q=` responde depois de 300 ms.
- **Etiqueta de balança:** um código sem cadastro que `parseScaleLabel` (`src/lib/barcode-scale.ts`) aceite segue este caminho:
  - o código precisa ter 13 dígitos, prefixo `20` (valor) ou `21` (peso) e dígito verificador EAN-13 válido;
  - a tela busca o produto pelo código de 5 dígitos da etiqueta, que é o código de barras dele (`lookupScaleLabel` em `sale-api.ts`);
  - o produto entra com os gramas da etiqueta, ou com `floor(valor × 1000 / preço por kg)` na etiqueta por valor; assim a linha nunca passa do valor impresso;
  - produto que não é `KG` é recusado.

  Nada muda no servidor: a venda leva só o id e os gramas, e o preço continua sendo o do catálogo.

- O cliente recusa produto com o próximo lote vencido, sem saldo ou acima do saldo (toast de perigo); o servidor confere tudo de novo.
- **Desconto e pagamentos:** a venda envia `discount` (centavos) e `payments` (o que foi entregue em cada forma, uma linha por forma). `settlePayments` (`src/contracts/sales.ts`), usada pela tela e pelo servidor, confere se a soma cobre o total e tira o troco só do dinheiro. `sale_payments` guarda a parte de cada forma (o dinheiro já sem o troco) e é a única fonte da forma de pagamento para o caixa (esperado = parte em dinheiro) e para os relatórios. `sales.amount_received` é tudo o que foi entregue e `change` o troco.
- **Fiado:** com uma linha `ON_ACCOUNT`, a transação da venda faz um único `UPDATE customers SET current_debt = current_debt + x WHERE ativo AND current_debt + x <= credit_limit` e grava o DEBIT no extrato. Vendas simultâneas do mesmo cliente esperam a linha e cada uma vê o saldo deixado pela anterior; sem linha atualizada, tudo é desfeito (422 com `fields.customerId`). A quitação (`/api/admin/customers/{id}/payments`) faz o inverso com `WHERE current_debt >= x`, com id do cliente para não repetir um pagamento após resposta perdida.
- `POST /api/sales` recebe só ids e quantidades. O servidor usa os preços e custos atuais do catálogo, compara o total com o que o operador viu (409 com `fields.total` se um preço mudou; a tela recarrega os preços) e, numa transação, grava a venda e os itens (com preço e custo da hora) e dá baixa PVPS em cada produto, em ordem fixa de produto para não haver deadlock. Lote vencido, falta de estoque ou produto inativo desfazem tudo. O id da venda vem do cliente e só muda depois de uma venda concluída ou cancelada: repetir após uma resposta perdida devolve a venda já gravada.
- O comprovante sai por `window.print()` (só o comprovante vai ao papel, na largura que o driver da bobina informa) ou por link `wa.me` com o texto pronto.
- Atalhos: F1 busca, F2 pagamento, Esc limpa a busca ou fecha a janela, Enter confirma.
- Sem caixa aberto, a tela mostra só a abertura (troco inicial), e `POST /api/sales` responde 422 com `fields.cash` ("Não é possível realizar vendas com o caixa fechado."). O botão "Caixa" do cabeçalho e os atalhos F8 (sangria), F9 (suprimento) e F4 (fechamento) abrem as operações; o fechamento recusa uma venda em andamento.

**Fornecedores e reposição** (`src/domains/suppliers`, só `ADMIN`):

- `suppliers` guarda nome, CNPJ/CPF (`cnpj_cpf`, só dígitos, único quando preenchido), WhatsApp, e-mail, contato e situação. `product_suppliers` liga produto e fornecedor com o código do fornecedor; um índice único parcial garante no máximo um `is_default` por produto, e `setDefaultSupplier` trava a linha do produto para dois editores não colidirem.
- O produto expõe `defaultSupplierId` e `supplierCode` no contrato; criar ou editar grava o vínculo depois do produto. Um fornecedor inativo não pode ser escolhido de novo, mas o atual continua até ser trocado.
- A reposição (`selectReplenishmentRows`) lista produtos ativos com estoque menor ou igual ao mínimo, ou com lote em estoque vencendo até hoje + 30 dias no fuso da loja, e calcula 2 × mínimo − estoque (`replenishment.ts`). Fornecedor inativo conta como sem fornecedor. O pedido por WhatsApp é montado na tela (`order-text.ts`), com 55 antes de DDD + número.

**Relatórios** (`src/domains/reports`, só `ADMIN`):

- O período vira dias de calendário da loja (`period.ts`): hoje, hoje e os 6 dias anteriores, hoje e os 29 anteriores, do dia 1 até hoje, ou datas livres (até 366 dias). As consultas filtram `created_at` entre a meia-noite local do primeiro dia e a do dia seguinte ao último, com `AT TIME ZONE 'America/Sao_Paulo'` no PostgreSQL, que trata o horário de verão se ele voltar. O fuso é uma constante única (`src/lib/store-time.ts`).
- Faturamento é a soma de `sales.total`; CMV, a soma de `sale_items.cost` (custo × quantidade arredondado na hora da venda). Lucro bruto = faturamento − CMV; margem = lucro ÷ faturamento, com uma casa (`finance.ts`); a faixa de cor (`marginLevel` em `contracts/reports.ts`) é verde a partir de 20%, amarela de 10% a menos de 20%, vermelha abaixo.
- Os rankings agrupam por produto; o de quantidade compara kg e L com unidades (3 kg pesam como 3 unidades, não 3.000).
- As consultas de um relatório (seis no painel, contagem e página no histórico) rodam numa só transação somente leitura com `repeatable read` (`readReport`): uma venda gravada no meio da leitura não entra no CMV sem entrar no faturamento.
- `POST /api/admin/reports/daily-email` envia o resumo de hoje ao e-mail da sessão, em HTML (sem estilos, com nomes escapados) e texto, até 5 vezes por hora por usuário. Falha do provedor vira 502 com mensagem, sem detalhes do Resend.

**Caixa diário** (`src/domains/cash`):

- Um caixa aberto por vez: índice único parcial em `cash_sessions(status) WHERE status = 'OPEN'`. Abrir com outro aberto responde 409.
- A venda e a sangria/suprimento travam o caixa aberto com `FOR SHARE` dentro da sua transação e gravam o `cash_session_id`. O fechamento trava a linha com `FOR UPDATE`: espera as vendas em andamento e só depois soma, num comando seguinte, as vendas em dinheiro e as movimentações. Uma venda que esperava o fechamento encontra o caixa fechado e é recusada. As duas corridas têm teste com banco real (`cash.db.test.ts`), conferido por mutação.
- Esperado = troco inicial + vendas em dinheiro (o total; o troco devolvido não fica na gaveta) + suprimentos − sangrias (`expected.ts`). Pix e cartão não entram. A quebra é contado − esperado: positiva é sobra, negativa é falta.
- Fechamento cego: `POST /api/cash/close` grava esperado, contado e quebra, mas responde só o contado. O esperado e a quebra aparecem apenas em `GET /api/admin/cash-sessions` e no registro de atividade, que são só do `ADMIN`. Repetir o fechamento com a mesma contagem devolve o mesmo resultado; outra contagem ou outro caixa respondem 409.
- Sangria e suprimento têm id do cliente (repetir não grava duas vezes) e motivo obrigatório, também por CHECK no banco.

Pastas novas só nascem com código real.

Guardas automáticas atuais (ESLint):

- `quality/no-direct-data-access` impede importar `getDb`/`db` de `@/infrastructure/db` em `src/app`, `src/components` e arquivos `.tsx`.
- `drizzle/enforce-delete-with-where` e `drizzle/enforce-update-with-where` exigem `where`.
- `quality/no-direct-console` aponta o logger.
- `quality/max-lines` limita arquivos a 350 linhas.

## Dados e migrations

- **Schema:** `src/infrastructure/db/schema/` (re-exportado por `index.ts`). Hoje: enums `user_role` (`ADMIN`, `CASHIER`) e `verification_purpose`, e as tabelas `users` (`id` uuid com `gen_random_uuid()`, `name`, `email` único sempre em minúsculas, `password_hash` anulável no formato `scrypt$N$r$p$salt$hash`, `role`, `active`, `last_login_at`, `password_changed_at`, `created_at`), `stores` (uma linha por instalação, garantida por `stores_singleton`), `sessions` (id = SHA-256 do token; apagada em cascata com o usuário), `verification_codes` e `activity_log` (`user_id` vira nulo ao apagar o usuário). Testes com banco real: `*.db.test.ts` via `npm run test:db`, quase todos numa transação com rollback (`withTestDb`); só os testes de concorrência (cadastro com palpites em paralelo, último `ADMIN`, corrida de sessão, baixa de estoque) usam `withTestPool`, fazem commit com e-mails únicos e apagam o que criaram. As tabelas de catálogo e estoque estão em `inventory.ts`: `categories`, `products`, `inventory_batches` e `inventory_movements`, com os enums `product_unit` (`UN`, `KG`, `L`) e `inventory_movement_type` (`IN`, `OUT`, `ADJUSTMENT`). Preços em centavos inteiros por unidade, kg ou L; quantidades inteiras na unidade-base (unidades, gramas ou mililitros). O estoque é a soma dos lotes. Validade nula indica item que não vence, e esse lote sai por último. A baixa PVPS (`takeStock`, em `stock-repository.ts`) trava os lotes do produto com `FOR UPDATE`, reparte a quantidade e grava uma movimentação `OUT` por lote; sem estoque suficiente, nada muda. A baixa manual (`consumeStock`) aceita um `id` do cliente, gravado em `inventory_movements.operation_id` em todas as movimentações da baixa: repetir o mesmo id devolve a baixa gravada sem tirar estoque de novo (um advisory lock do PostgreSQL enfileira pedidos simultâneos com o mesmo id), e o id com outra baixa responde 409. Ela usa `takeStock` numa transação própria e também consome lotes vencidos, que é como eles saem da prateleira; a venda a usa dentro da sua transação e recusa o produto quando um lote com saldo está vencido. `ADJUSTMENT` existe no enum, mas ainda não tem rota. A unidade do produto não muda depois do primeiro lote, porque as quantidades gravadas dependem dela. As listas são paginadas no servidor (`?search=&page=`). Semáforo (`semaphore.ts`, datas no fuso da loja): lote vermelho se vencido ou se vence em até 7 dias, amarelo de 8 a 30 dias; estoque vermelho se zerado, amarelo no mínimo ou abaixo; o produto assume o pior deles. O saldo soma todos os lotes, inclusive vencidos, que continuam na prateleira até a baixa. `/admin/products` e `/admin/inventory` redirecionam para `/painel/produtos` e `/painel/estoque`. O caixa diário está em `cash.ts`: `cash_sessions` (operador que abriu, abertura e fechamento, troco inicial, esperado, contado, quebra, `status` `OPEN`/`CLOSED`, observações; um CHECK exige os campos de fechamento só e sempre no caixa fechado, com quebra igual a contado − esperado) e `cash_movements` (`BLEED` = sangria, `SUPPLY` = suprimento, valor positivo e motivo). As vendas estão em `sales.ts`, com `cash_session_id` (nulo só nas vendas anteriores ao caixa diário): `sales` (id escolhido pelo cliente, `number` sequencial para o comprovante, operador, forma de pagamento `payment_method` — `CASH`, `PIX`, `DEBIT`, `CREDIT` —, total, recebido e troco, com CHECK de que o troco é recebido menos total) e `sale_items` (nome, unidade, quantidade, preço e custo unitários, total e custo da linha, como estavam na hora da venda). O total de cada linha pesável é arredondado ao centavo (`lineTotal` em `contracts/sales.ts`, usado pelo servidor e pela tela), e o da venda é a soma das linhas. As próximas tabelas virão do PRODUCT.md, fluxo a fluxo.
- **SQL versionado:** `drizzle/0000_needy_nightcrawler.sql` (cria `user_role` e `users`) e `drizzle/0001_auth_foundation.sql` (apaga os usuários antigos, troca `username` por `name`/`email` e cria loja, sessões, códigos e log de atividade). `drizzle/0002_pale_secret_warriors.sql` (torna `sessions.csrf_hash` obrigatório, adiciona os CHECKs `users_email_lowercase` e `stores_singleton_true` e troca o índice dos códigos por `(email, purpose, created_at)`; antes, apaga sessões sem hash CSRF e põe e-mails em minúsculas). `drizzle/0003_curly_lizard.sql` cria as tabelas de catálogo e estoque, e `drizzle/0004_flaky_skin.sql` torna a validade do lote opcional. Gerar não exige conexão.
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
