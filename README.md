# Mkt Control

Controle de vendas e estoque para pequenos comércios e mercadinhos: validade por lote (PVPS), reposição, caixa diário com fechamento cego e lucro real (faturamento menos CMV). O escopo completo está em [PRODUCT.md](PRODUCT.md).

**Estado atual:** base técnica, autenticação por e-mail (perfis `ADMIN`/`CASHIER`), painel administrativo, catálogo e estoque por lote (PVPS) e frente de caixa (`/caixa`) prontos. As demais funcionalidades serão entregues uma por vez.

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

Verificação completa (sem banco nem credenciais): `npm run check`.

Primeiro acesso: com o seed, entre em `/login` com `ana@bompreco.com.br` (administrador, vai para o painel) ou `carlos@bompreco.com.br` (operador, vai para a frente de caixa), ambos com a senha `mkt12345` (só em desenvolvimento). Numa instalação real, use "Criar conta da loja" em `/login`. Para criar um usuário pela linha de comando: `npm run user:create -- <email> "<Nome completo>" <ADMIN|CASHIER>` (a senha inicial aparece só nessa hora).

Imagem de produção: `docker build -t mkt-control .` e depois `docker run -p 3000:3000 -e DATABASE_URL=... -e RESEND_API_KEY=... -e MAIL_FROM=... mkt-control` (`RESEND_API_KEY` e `MAIL_FROM` são obrigatórios em produção).

## Documentação

- [Produto e escopo](PRODUCT.md).
- [Roadmap de entregas](ROADMAP.md).
- [Preparação local](docs/onboarding.md).
- [Estrutura e decisões técnicas](docs/architecture.md).
- [Design, acessibilidade e tokens](DESIGN.md); vitrine em `/design-system`.
- [Verificações de qualidade](docs/quality.md).
- [Instruções para agentes](AGENTS.md).
- [Setup e evidências](docs/setup.md).

## Próxima entrega

Caixa diário: abertura com troco, sangria, suprimento e fechamento cego. Critério: sem caixa aberto, o servidor recusa a venda mesmo que o cliente envie a requisição.
