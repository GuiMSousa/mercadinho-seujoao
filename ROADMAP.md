# Roadmap Oficial de Entregas — Mkt Control

## Status Geral do Projeto

**Release v1.0.0 (2026-11-06):** as nove semanas foram executadas e homologadas. O sistema está pronto para implantação ([docs/deploy.md](docs/deploy.md)). Os itens abaixo ainda não estão entregues: ou dependem do HTTPS com domínio fixo (conta Cloudflare da loja), ou ficaram para depois da v1.0.0. Eles não são marcados como concluídos.

- **Semana 1:** CONCLUÍDA (Fundação, Autenticação e Landing Page)
- **Semana 2:** CONCLUÍDA (Design System & PWA Base); falta conferir a instalação como PWA num aparelho, o que depende do HTTPS
- **Semana 3:** CONCLUÍDA (PDV, comprovante térmico e por WhatsApp, arredondamento por item); falta o leitor por câmera, que depende do HTTPS
- **Semana 4:** CONCLUÍDA (caixa diário, 2026-11-05)
- **Semana 5:** CONCLUÍDA (relatórios financeiros, 2026-11-05)
- **Semana 6:** CONCLUÍDA (fornecedores, reposição e pedido por WhatsApp, 2026-11-05); fica para depois o indicador de alerta no topo do painel
- **Semana 7:** CONCLUÍDA (etiqueta de balança no PDV e revisão de toque, campos, 375 px e contraste, 2026-11-06)
- **Semana 8:** CONCLUÍDA EM PARTE (fiado com limite de crédito, quitação, desconto e pagamento dividido, 2026-11-06); ficam para depois VR/VA, histórico de pedidos de compra e previsão de compras
- **Semana 9:** CONCLUÍDA (produção, 2026-11-06); o túnel com domínio fixo e a entrada em produção são passos da loja, descritos no guia de implantação

**Pendências depois da v1.0.0:**

- Leitor por câmera e PWA instalado num aparelho (dependem do HTTPS).
- VR/VA como forma de pagamento.
- Histórico de pedidos de compra e previsão de compras.
- Indicador de alerta no topo do painel.
- Layout próprio por largura de bobina (hoje o comprovante usa a largura que a impressora informa).

> **Conferência com o código (2026-11-03):** entregue desde a conferência de 2026-11-01:
>
> - Landing Page pública em `/`, com chamada para `/login`.
> - Viewport para iOS/Android, `manifest.json`, ícones e Service Worker (`sw.js`).
> - Catálogo e estoque na API e no banco: categorias, produtos, lotes, movimentações e baixa PVPS.
>
> Ainda não estão no repositório:
>
> - Leitor de código de barras: só existe a busca por código, `GET /api/products?barcode=`.
> - Baixa manual e extrato de movimentações no painel: `/painel/produtos` cadastra categorias e produtos, e `/painel/estoque` registra entradas e mostra os lotes com o semáforo.
> - Instalação como PWA conferida em aparelho: o navegador exige HTTPS, que chega com o domínio fixo da semana 9.
>
> **Mudança de ordem (2026-11-03):** o catálogo de produtos e os lotes com PVPS vêm antes do PDV, para o caixa ter itens cadastrados para dar baixa. Por isso a base de lotes e PVPS da semana 6 já está entregue; alertas e relatório de reposição continuam na semana 6.
>
> **Entregue em 2026-11-05 (semana 3, em parte):** frente de caixa em `/caixa` para os dois perfis, com o login do operador indo direto para ela.
>
> - Leitor USB e busca por nome.
> - Recusa de produto sem saldo ou com lote vencido.
> - Itens pesáveis com arredondamento por item.
> - Pagamento em dinheiro com troco, Pix, débito ou crédito.
> - Baixa PVPS e custo gravados na venda.
> - Comprovante para impressão térmica pelo navegador e por WhatsApp.
>
> Faltam da semana 3 o leitor por câmera (exige HTTPS) e um layout próprio para cada largura de bobina; o comprovante usa a largura que a impressora informa. A baixa manual de estoque também entrou, para tirar lotes vencidos da prateleira.
>
> Conferência anterior em [docs/auditoria-calendario-2026-11-01.md](docs/auditoria-calendario-2026-11-01.md).

---

### Semana 1 — Arquitetura Base & Layout Responsivo (ENTREGUE)

- Configuração do ambiente (Node.js 24, Docker, PostgreSQL 18 e Drizzle ORM).
- Layout mobile-first responsivo e correções de viewport/zoom em iOS/Android.
- Estrutura inicial de produtos, categorias, autenticação (ADMIN/CASHIER), sessões no banco e Landing Page (`/`).

### Semana 2 — PWA Universal & Experiência Mobile (ENTREGUE)

- Configuração do `manifest.json` com modo standalone e cores do sistema.
- Service Worker (`sw.js`) para cache de assets e leitor de código de barras.
- Compatibilidade e instalação em iOS Safari, Android Chrome e PC.
- Implementação dos tokens visuais e componentes do Design System (`@ds/components`).

### Semana 3 — Frente de Caixa (PDV), Recibos & WhatsApp

- Leitor de código de barras por câmera multi-lente via HTTPS.
- Emissão de recibos térmicos formatados para bobinas de 58mm e 80mm.
- Envio de comprovante resumido via WhatsApp Web/App.
- Regra de arredondamento por item ao centavo (precisão fiscal por quilo).

### Semana 4 — Gestão e Controle Financeiro de Caixa (ENTREGUE em 2026-11-05)

Abertura com troco, sangria e suprimento com motivo, fechamento cego em `/caixa` e conciliação com quebra em `/painel/caixa`. Vendas bloqueadas na tela e no servidor com o caixa fechado.

- Módulo de abertura com valor inicial de troco.
- Movimentações: Sangrias (retiradas) e Suprimentos (entradas) com motivo.
- Fechamento cego (operador) e detalhado com cálculo de quebra (admin).
- Bloqueio total de vendas no PDV e no servidor quando o caixa estiver fechado.

### Semana 5 — Painel de Relatórios Financeiros & Lucratividade (ENTREGUE em 2026-11-05)

Em `/painel/relatorios`: períodos no fuso da loja, faturamento, CMV, lucro, margem com selo de cor, ticket médio, formas de pagamento, 5 produtos mais vendidos, histórico de vendas com margem e resumo do dia por e-mail (Resend). O custo histórico já é gravado em cada venda desde a semana 3.

- Dashboard de relatórios com filtros por período (Hoje, 7 dias, 30 dias, Mês, Livre).
- Cálculo de Faturamento Bruto, CMV (Custo da Mercadoria Vendida) e Lucro Bruto.
- Margem de Lucro (%) com destaque de cor e Ticket Médio.
- Gravação do custo histórico da mercadoria na venda e fuso horário local.

### Semana 6 — Estoque, Lotes e Alerta de Reposição (ENTREGUE em 2026-11-05)

Fornecedores em `/painel/fornecedores`, fornecedor padrão no produto, reposição em `/painel/estoque/reposicao` (2 × mínimo − estoque, agrupada por fornecedor) e pedido por WhatsApp. Junto, a blindagem da auditoria: backup do banco (`scripts/backup-db.*`), baixa manual idempotente, leitura do relatório num só instante e o atalho de rota renomeado para `sessionRoute`. Fica para depois o indicador de alerta no topo do painel.

- Campo `estoque_minimo` no cadastro e edição de produtos.
- Controle de produtos por lote e validade com regra PVPS (Primeiro que Vence, Primeiro que Sai).
- Indicador visual de alerta no topo para estoque crítico ou produtos perto da validade.
- Relatório de reposição com sugestão automática de quantidade de compra e envio para fornecedor via WhatsApp.

### Semana 7 — Implementação, Design & Configuração Completa do Frontend (ENTREGUE em 2026-11-06)

A leitura de etiquetas de balança veio da semana 8 para cá. O PDV lê o EAN-13 da balança (`20` por valor, `21` por peso, com dígito verificador) e acha o produto pesável pelo código de 5 dígitos, que é o código de barras dele no cadastro. O preço cobrado continua sendo o do catálogo. A revisão de interface trouxe estes ajustes:

- tudo no balcão (`/caixa`, entrada e baixa de estoque) com 60 px ou mais, inclusive o cabeçalho e o comprovante; o painel segue com 40 px;
- campos com 16 px em todos os tamanhos;
- nenhuma rota com rolagem lateral em 375 px;
- contraste de 4,5:1 ou mais em selos, semáforo, botões e textos nos dois temas, garantido por `design-system/contrast.test.ts`.

- Implementação da estrutura base, rotas e componentes do frontend.
- Padronização de design (UI/UX, cores, tipografia e temas claro/escuro).
- Ajustes de responsividade mobile/desktop e otimização para telas touch do balcão (botões ≥ 60px).
- Integração completa do layout com todas as rotas e endpoints da API.

### Semana 8 — Vendas a Prazo (Fiado), Descontos & Balança (ENTREGUE EM PARTE em 2026-11-06)

Clientes em `/painel/clientes` com limite de crédito, saldo devedor, extrato e quitação total ou parcial com comprovante para impressão e WhatsApp. No PDV, a venda pode ter desconto em R$ ou % (F3) e ser paga em várias formas, inclusive no fiado; o servidor recusa o fiado que passar do limite. Ficam para a próxima: VR/VA como forma de pagamento, histórico de pedidos de compra e previsão de compras.

- Cadastro de clientes com histórico de compras, limite de crédito e saldo devedor (fiado).
- Campo de desconto em valor (R$) ou percentual (%) na tela de checkout do PDV.
- Múltiplos pagamentos (VR/VA, PIX, Cartão). A leitura de etiquetas de balança foi entregue na semana 7.
- Cadastro de fornecedores, histórico de pedidos e previsão de compras.

### Semana 9 — Produção, Domínio Fixo & Infraestrutura Final (CONCLUÍDA em 2026-11-06)

Entregues:

- **Saúde e segurança:** `GET /api/health` (pública, `SELECT 1`, 503 sem detalhes quando o banco cai); CSP com nonce em todas as páginas; os cabeçalhos de segurança que já existiam continuam.
- **Docker:** `compose.prod.yaml` com app e PostgreSQL 18 separados do banco de desenvolvimento, e a imagem aplicando as migrações ao iniciar.
- **Backup:** scripts que também apontam para a produção, com agendamento pelo Agendador de Tarefas e pelo cron.
- **Guia de implantação** ([docs/deploy.md](docs/deploy.md)) com Cloudflare Named Tunnel, restauração e atualização.
- **Homologação:** `npm run check`, `npm run test:db`, os roteiros no navegador e a subida do contêiner num banco novo, com as rotas e a CSP conferidas no navegador.

Criar o túnel com o domínio da loja e pôr o sistema em produção são passos feitos na conta e no computador da loja, seguindo o guia.

- Configuração de domínio estático fixo via Cloudflare Named Tunnel / Ngrok.
- Rotina automatizada de backup diário do banco de dados PostgreSQL.
- Bateria final de testes E2E/Integração, homologação e documentação de implantação.
- Entrega final do sistema em produção.
