# Mkt Control

Controle de vendas e estoque para pequenos comércios e mercadinhos: validade por lote (PVPS), reposição, caixa diário com fechamento cego e lucro real (faturamento menos CMV). O escopo completo está em [PRODUCT.md](PRODUCT.md).

**Estado atual:** base técnica e autenticação (perfis `ADMIN`/`CASHIER`) prontas. As demais funcionalidades serão entregues uma por vez.

## Executar

Requisitos: Node.js 24 (ver `.nvmrc`), npm 11 e Docker Desktop com Docker Compose.

```bash
npm ci
cp .env.example .env.local   # preencha os valores locais (ver docs/onboarding.md)
npm run db:up                # PostgreSQL 18 local com healthcheck
npm run dev                  # http://localhost:3000
```

Verificação completa (sem banco nem credenciais): `npm run check`.

Primeiro acesso (uma vez): `npm run db:migrate` e `npm run user:create -- <seu-usuario> ADMIN`. A senha inicial aparece só nessa hora; depois entre em `/login`.

Imagem de produção: `docker build -t mkt-control .` e depois `docker run -p 3000:3000 -e DATABASE_URL=... -e SESSION_SECRET=... mkt-control`.

## Documentação

- [Produto e escopo](PRODUCT.md).
- [Preparação local](docs/onboarding.md).
- [Estrutura e decisões técnicas](docs/architecture.md).
- [Design, acessibilidade e tokens](DESIGN.md); vitrine em `/design-system`.
- [Verificações de qualidade](docs/quality.md).
- [Instruções para agentes](AGENTS.md).
- [Setup e evidências](docs/setup.md).

## Próxima entrega

Cadastro de produtos (unitários e pesáveis) e entrada de estoque com lote e validade. Critério: um `CASHIER` consulta produtos sem receber o preço de custo, e uma entrada sem lote ou validade é recusada pelo servidor. A autenticação com perfis `ADMIN`/`CASHIER` já está entregue.
