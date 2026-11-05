# Roadmap Oficial de Entregas — Mkt Control

## Status Geral do Projeto

- **Semana 1:** ENTREGUE (Fundação, Autenticação e Landing Page)
- **Semana 2:** ENTREGUE (Design System & PWA Base)
- **Semana 3:** EM EXECUÇÃO (PDV e recibos entregues; leitor por câmera pendente)
- **Semanas 4 a 9:** PLANEJADAS

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

### Semana 4 — Gestão e Controle Financeiro de Caixa

- Módulo de abertura com valor inicial de troco.
- Movimentações: Sangrias (retiradas) e Suprimentos (entradas) com motivo.
- Fechamento cego (operador) e detalhado com cálculo de quebra (admin).
- Bloqueio total de vendas no PDV e no servidor quando o caixa estiver fechado.

### Semana 5 — Painel de Relatórios Financeiros & Lucratividade

- Dashboard de relatórios com filtros por período (Hoje, 7 dias, 30 dias, Mês, Livre).
- Cálculo de Faturamento Bruto, CMV (Custo da Mercadoria Vendida) e Lucro Bruto.
- Margem de Lucro (%) com destaque de cor e Ticket Médio.
- Gravação do custo histórico da mercadoria na venda e fuso horário local.

### Semana 6 — Estoque, Lotes e Alerta de Reposição

- Campo `estoque_minimo` no cadastro e edição de produtos.
- Controle de produtos por lote e validade com regra PVPS (Primeiro que Vence, Primeiro que Sai).
- Indicador visual de alerta no topo para estoque crítico ou produtos perto da validade.
- Relatório de reposição com sugestão automática de quantidade de compra e envio para fornecedor via WhatsApp.

### Semana 7 — Implementação, Design & Configuração Completa do Frontend

- Implementação da estrutura base, rotas e componentes do frontend.
- Padronização de design (UI/UX, cores, tipografia e temas claro/escuro).
- Ajustes de responsividade mobile/desktop e otimização para telas touch do balcão (botões ≥ 60px).
- Integração completa do layout com todas as rotas e endpoints da API.

### Semana 8 — Vendas a Prazo (Fiado), Descontos & Balança

- Cadastro de clientes com histórico de compras, limite de crédito e saldo devedor (fiado).
- Campo de desconto em valor (R$) ou percentual (%) na tela de checkout do PDV.
- Leitura de etiquetas de balança de açougue/hortifruti e múltiplos pagamentos (VR/VA, PIX, Cartão).
- Cadastro de fornecedores, histórico de pedidos e previsão de compras.

### Semana 9 — Produção, Domínio Fixo & Infraestrutura Final

- Configuração de domínio estático fixo via Cloudflare Named Tunnel / Ngrok.
- Rotina automatizada de backup diário do banco de dados PostgreSQL.
- Bateria final de testes E2E/Integração, homologação e documentação de implantação.
- Entrega final do sistema em produção.
