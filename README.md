# Mkt Control

Controle de vendas e estoque para pequenos comércios e mercadinhos: validade por lote (PVPS), reposição, caixa diário com fechamento cego e lucro real (faturamento menos CMV). O escopo completo está em [PRODUCT.md](PRODUCT.md).

**Estado atual:** base técnica, autenticação por e-mail (perfis `ADMIN`/`CASHIER`), painel administrativo, catálogo e estoque por lote (PVPS), frente de caixa (`/caixa`, com leitura de etiqueta de balança, desconto e pagamento dividido), clientes com fiado, limite de crédito e quitação (`/painel/clientes`), caixa diário com fechamento cego e conciliação (`/painel/caixa`), relatórios financeiros com CMV e margem (`/painel/relatorios`) e fornecedores com reposição e pedido por WhatsApp (`/painel/fornecedores`, `/painel/estoque/reposicao`) prontos. Versão 1.0.0, com imagem Docker de produção, migrações automáticas, rota de saúde, CSP e backup agendável ([guia de implantação](docs/deploy.md)). O que ainda falta está em [ROADMAP.md](ROADMAP.md).

## Executar

Requisitos: Node.js 24 (ver `.nvmrc`), npm 11 e Docker Desktop com Docker Compose.

```bash
npm ci
cp .env.example .env.local   # preencha os valores locais (ver docs/onboarding.md)
npm run db:up                # PostgreSQL 18 local com healthcheck
npm run db:migrate
npm run db:seed              # só desenvolvimento: loja e usuários de demonstração
npm run dev                  # http://localhost:3000
```

## Testes

- `npm run check`: formatação, lint (inclusive o tipado), tipos, testes sem banco, contrato OpenAPI e build de produção. Não precisa de banco nem de credenciais.
- `npm run test:db`: testes contra o PostgreSQL real, no banco de teste `DATABASE_URL_TEST`. Aplique as migrações nele antes, com `npm run db:migrate:test`.
- `npm test` roda só os testes sem banco; `npm run test:watch` os repete a cada mudança.

Primeiro acesso: com o seed, entre em `/login` com `ana@bompreco.com.br` (administrador, vai para o painel) ou `carlos@bompreco.com.br` (operador, vai para a frente de caixa), ambos com a senha `mkt12345` (só em desenvolvimento). Numa instalação real, use "Criar conta da loja" em `/login`. Para criar um usuário pela linha de comando: `npm run user:create -- <email> "<Nome completo>" <ADMIN|CASHIER>` (a senha inicial aparece só nessa hora).

## Produção

O passo a passo completo (Cloudflare Tunnel, backup agendado, restauração e atualização) está em [docs/deploy.md](docs/deploy.md). Em resumo:

```bash
cp .env.production.example .env.production   # senha do banco, RESEND_API_KEY e MAIL_FROM
docker compose -f compose.prod.yaml --env-file .env.production up -d --build
curl http://127.0.0.1:3000/api/health        # {"status":"ok",...,"db":"connected"}
```

O app aplica as migrações pendentes ao iniciar. Backup diário: `pwsh -NoProfile -File scripts/backup-db.ps1 -EnvFile .env.production -ComposeFile compose.prod.yaml`, agendado pelo Agendador de Tarefas (Windows) ou pelo cron (Linux), como mostra o guia.

## Atalhos da frente de caixa (`/caixa`)

| Tecla | Ação                                                                               |
| ----- | ---------------------------------------------------------------------------------- |
| F1    | Ir para a busca (código de barras, etiqueta de balança ou nome)                    |
| F2    | Pagamento                                                                          |
| F3    | Desconto na venda, em R$ ou % (o botão % de cada linha dá desconto só no item)     |
| F4    | Fechar o caixa (fechamento cego)                                                   |
| F8    | Sangria                                                                            |
| F9    | Suprimento                                                                         |
| Enter | Confirmar o item, o valor ou a opção; no pagamento, o campo vazio paga o que falta |
| Esc   | Limpar a busca ou fechar a janela                                                  |

No pagamento, uma letra escolhe a forma: D dinheiro, P Pix, B débito, C crédito, F fiado, R vale-refeição e A vale-alimentação. O operador dá no máximo 5% de desconto na venda; acima disso, chame um administrador.

O leitor USB funciona como teclado: basta bipar, mesmo com o foco num botão do carrinho.

## Documentação

- [Produto e escopo](PRODUCT.md).
- [Roadmap de entregas](ROADMAP.md).
- [Preparação local](docs/onboarding.md).
- [Estrutura e decisões técnicas](docs/architecture.md).
- [Design, acessibilidade e tokens](DESIGN.md); vitrine em `/design-system`.
- [Verificações de qualidade](docs/quality.md).
- [Instruções para agentes](AGENTS.md).
- [Setup e evidências](docs/setup.md).
- [Implantação em produção](docs/deploy.md).

## Próxima entrega

Leitor por câmera e instalação como PWA conferida em aparelho, que dependem do HTTPS do túnel com domínio fixo. Depois, VR/VA como forma de pagamento, histórico de pedidos de compra e previsão de compras.
