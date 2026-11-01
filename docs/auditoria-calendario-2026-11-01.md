# Auditoria do projeto × Calendário de Entregas

Data: 2026-11-01. Base: `main` em `f08a4fb`.
Fontes lidas:

- código em `src/`: 8 páginas, 16 rotas de API e 4 domínios (`auth`, `users`, `store`, `activity`);
- schemas Drizzle e as migrations `0000` a `0002`;
- `src/contracts/openapi.json` (16 caminhos);
- 64 arquivos de teste, sendo 12 com banco real;
- `PRODUCT.md`, `docs/` e o design de referência `docs/design-reference/painel-admin.dc.html`.

Verificação de 2026-10-30: `npm run check` com 200 testes unitários, 8 de contrato e build; `npm run test:db` com 67 testes; roteiro E2E com 15 de 15 passos aprovados.

Legenda: **Concluído** (implementado, testado e documentado) · **Parcial** · **Pendente**.

## Resumo

| Semana | Tema                       | Situação | Observação                                                                                            |
| ------ | -------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| 1      | Landing & Login            | Parcial  | Login, perfis e rotas protegidas prontos; a landing está desenhada, mas não implementada              |
| 2      | Painel Admin               | Parcial  | O shell do painel está pronto; dashboard, alertas e resumo do dia dependem de dados das semanas 3 e 5 |
| 3      | Estoque & Lotes            | Pendente | Não há tabelas de produto, lote nem movimentação                                                      |
| 4      | Fornecedores               | Pendente | Escopo novo: não aparece no `PRODUCT.md`                                                              |
| 5      | Caixa / PDV                | Pendente | Balança e VR/VA são escopo novo                                                                       |
| 6      | Fechamento do dia & e-mail | Pendente | O mailer Resend está pronto e testado; falta o relatório                                              |
| 7      | IA & automações de compra  | Pendente | Escopo novo                                                                                           |

## Semana 1: Landing & Login

| Item                            | Situação  | Evidência                                                                                                                                                                                                                      |
| ------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Perfis `ADMIN` e `CASHIER`      | Concluído | `pgEnum("user_role")` em `src/infrastructure/db/schema/users.ts`; regra única `accessDenial` em `src/domains/auth/access.ts`                                                                                                   |
| Login                           | Concluído | Login por e-mail com sessões no banco, revogáveis. "Manter conectado" dá 30 dias deslizantes. CSRF por sessão. Rate limit por IP e por conta. Telas `/login`, `/cadastro` e `/recuperar`                                       |
| Rotas protegidas                | Concluído | Seguro por padrão: tudo exige sessão, exceto a lista pública. Prefixos só para ADMIN: `/painel`, `/api/admin`, `/api/account` e `/api/store`. `requireAdmin()` em cada página do painel. Testes de proxy, de acesso e de rotas |
| Cadastro, recuperação e convite | Concluído | Cadastro da loja em 3 etapas com código por e-mail, recuperação de senha, convite com validade de 48 h e link direto, gestão de equipe e registro de atividade                                                                 |
| Landing page                    | Pendente  | O design existe (artifact `PrUCqFpoKVAqeHcJddQ9EQ`), mas a implementação foi pausada a pedido. Hoje `/` só redireciona para `/login` ou `/painel`                                                                              |

Ponto de atenção: hoje o `CASHIER` é recusado no login com a mensagem "Operadores usam o PDV". O perfil existe e é gerenciado na equipe, mas só terá uso real quando o PDV existir (semana 5).

## Semana 2: Painel Admin

| Item                 | Situação  | Evidência / falta                                                                                                                                                                                           |
| -------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell do painel      | Concluído | Menu lateral, topo, gaveta no celular, tema persistido e notificações por toast (`src/app/painel/**`)                                                                                                       |
| Dashboard por perfil | Parcial   | `/painel` mostra só a saudação e a data, e é exclusivo do ADMIN. Não há visão de `CASHIER`: a spec decidiu que o operador usa o PDV. Os KPIs do design (faturamento, CMV, margem, ticket médio) não existem |
| Alertas de estoque   | Pendente  | Precisam de produtos, lotes e estoque mínimo (semana 3)                                                                                                                                                     |
| Resumo do dia        | Pendente  | Precisa de vendas e caixa (semana 5)                                                                                                                                                                        |

Conflito de ordem: o calendário põe o dashboard antes do estoque e das vendas, de onde vêm os dados dele. Recomendação: na semana 2, entregar os cartões e alertas do dashboard já com o desenho final e estados vazios, mais o motor de alertas (validade e mínimo). Eles se ligam aos dados reais conforme as semanas 3 e 5 entram. A alternativa é inverter as semanas 2 e 3.

## Semana 3: Estoque & Lotes

| Item                    | Situação | Observação                                                                                                                     |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Cadastro de produtos    | Pendente | Nada no schema. O design define os campos: SKU/EAN, nome, categoria, preço, custo, mínimo e unidade (un/kg/l)                  |
| Lotes e validade        | Pendente | O design mostra lotes por produto e a situação "Em dia / A vencer / Vencidos"                                                  |
| Movimentação `IN`/`OUT` | Pendente | Precisa de uma tabela de movimentos (entrada, venda, perda, ajuste) com custo no momento do movimento, para o CMV              |
| Importação CSV          | Pendente | O `PRODUCT.md` define CSV **e XLSX** com as colunas `Código de Barras`, `Nome`, `Preço de Custo`, `Preço de Venda` e `Estoque` |

Dinheiro em centavos inteiros e peso em gramas (regra do `AGENTS.md`). O design system já tem `Money`, `Table`, `Badge` e `Dialog` prontos para essas telas.

## Semana 4: Fornecedores

| Item                           | Situação | Observação                                                                                                                                |
| ------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Cadastro de fornecedores       | Pendente | **Escopo novo**: o `PRODUCT.md` não fala em fornecedores. O design só tem o campo "Fornecedor" na entrada de estoque                      |
| Vínculo com produtos           | Pendente | Escopo novo                                                                                                                               |
| Gatilhos de reposição          | Pendente | O `PRODUCT.md` prevê a lista de reposição (sugestão = 2 × mínimo − atual) e um alerta diário opcional                                     |
| Envio de pedidos ao fornecedor | Pendente | Escopo novo. O `PRODUCT.md` fala só em "lista formatada para WhatsApp". Falta definir o canal (e-mail via Resend ou WhatsApp) e o formato |

## Semana 5: Caixa / PDV

| Item                                                           | Situação | Observação                                                                                                                                                                                                                                      |
| -------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tela de caixa (abertura, sangria, suprimento, fechamento cego) | Pendente | Coberta pelo `PRODUCT.md`. O design do painel tem a tela "Caixa"; o PDV de venda **não está no design atual**                                                                                                                                   |
| Atalhos de teclado                                             | Pendente | Precisam de especificação (por exemplo F2 buscar, F4 pagamento, Esc cancelar)                                                                                                                                                                   |
| Baixa automática de lote                                       | Pendente | **Divergência**: o calendário diz FIFO/PEPS, mas o `PRODUCT.md` define **PVPS** (o que vence primeiro sai primeiro). Para validade, PVPS é o correto; FIFO só coincide quando a ordem de entrada acompanha a de validade. Recomendo manter PVPS |
| Bloqueio de vencido no escâner                                 | Pendente | O design já prevê a opção "Bloquear venda de lote vencido no PDV" em Configurações                                                                                                                                                              |
| Leitura de balança                                             | Pendente | **Escopo novo**. Duas leituras possíveis: código de barras de balança (EAN-13 com prefixo 2 e peso ou preço embutido), que é simples, ou integração serial/USB, que precisa de hardware para testar                                             |
| Pagamento fracionado (Pix, cartão, VR/VA)                      | Pendente | O `PRODUCT.md` cobre dinheiro com troco, Pix, débito e crédito, combinados. **VR/VA são escopo novo**                                                                                                                                           |

## Semana 6: Fechamento do dia & envio por e-mail

| Item                  | Situação  | Observação                                                                                                                                                                     |
| --------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mailer Resend         | Concluído | `src/infrastructure/mail` com envio por `fetch`. Sem chave fora de produção, cai no log do terminal. Testes unitários e um disparo real verificado em 2026-11-01 (abaixo)      |
| Relatório consolidado | Pendente  | Depende das semanas 3 e 5: vendas, CMV, margem, formas de pagamento, quebra de caixa e lotes a vencer                                                                          |
| Disparo agendado      | Pendente  | Não há agendador. O app roda num servidor Node contínuo no PC da loja. Opções: um job dentro do processo ou uma tarefa agendada do Windows chamando uma rota interna protegida |

## Semana 7: IA & automações de compra

| Item                | Situação | Observação                                                                                                                                                                                            |
| ------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Previsão de demanda | Pendente | **Escopo novo**. Precisa de histórico de vendas. Uma média móvel por dia da semana já dá base, antes de qualquer modelo de IA. Se usar LLM, a regra do projeto pede autorização para provedor e custo |
| Automação de compra | Pendente | Escopo novo. Depende da semana 4 (fornecedores e pedidos)                                                                                                                                             |

## Mailer Resend (item 1 da solicitação)

- **Variáveis:** `RESEND_API_KEY` e `MAIL_FROM` estão definidas no `.env.local` (valores não exibidos).
- **Comportamento:** com chave, `getMailer()` envia pelo Resend em qualquer ambiente. Sem chave fora de produção, faz o fallback para o log (`mail (dev)` com o texto). Sem chave em produção, recusa com erro de configuração.
- **Testes:** `src/infrastructure/mail/mail.test.ts` e `src/lib/env.test.ts` cobrem envio, falha sem vazar o corpo da resposta, fallback e produção sem chave (12 testes verdes).
- **Disparo real (2026-11-01):** o template do código de cadastro foi enviado pelo `getMailer()` do projeto para `delivered@resend.dev`, a caixa de teste do Resend, e a resposta foi 2xx.
- **Limitação atual:**
  - `MAIL_FROM` usa um remetente `@resend.dev`, o modo de teste do Resend. Nesse modo, o Resend só entrega para o e-mail dono da conta.
  - Códigos de cadastro e recuperação para outros endereços, e convites, falham. O convite responde com erro e desfaz o usuário criado.
  - Correção (externa): verificar um domínio próprio no Resend e trocar `MAIL_FROM` para um endereço desse domínio.

## Divergências e decisões necessárias

1. **Escopo novo** em relação ao `PRODUCT.md`: fornecedores e envio de pedidos, balança, VR/VA e previsão de demanda com automação. Cada item precisa de spec antes de virar código.
2. **FIFO/PEPS × PVPS:** recomendo PVPS, como está no `PRODUCT.md`.
3. **Ordem das semanas 2 e 3:** o dashboard depende de dados que ainda não existem. Recomendo a abordagem descrita na semana 2, ou inverter as semanas.
4. **Dashboard do `CASHIER`:** a spec atual dá ao operador só o PDV. O calendário pede "dashboard por perfil". Se o operador precisar de painel, a regra de acesso muda.
5. **PDV fora do design:** o design de referência não tem a tela de venda do balcão. É preciso desenhá-la antes da semana 5.
6. **Landing page:** está desenhada e pausada; voltar com ela fecha a semana 1.

## Plano alinhado (proposta)

| Semana | Subprojeto                                                                                                                      | Pré-requisito                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1      | Landing page (design existente)                                                                                                 | —                                             |
| 2      | Dashboard com cartões, alertas e estados vazios, mais o motor de alertas                                                        | Decisões 3 e 4                                |
| 3      | Catálogo e estoque: produtos, lotes PVPS, movimentos IN/OUT, importação CSV/XLSX, perdas                                        | —                                             |
| 4      | Fornecedores, vínculo, reposição e envio de pedidos                                                                             | Spec do canal de envio                        |
| 5      | Caixa e PDV: caixa diário, venda com escâner, atalhos, baixa PVPS, bloqueio de vencido, balança por código, pagamento combinado | Design do PDV, decisão sobre VR/VA e balança  |
| 6      | Fechamento do dia: relatório consolidado e envio agendado pelo Resend                                                           | Domínio verificado no Resend                  |
| 7      | Previsão de demanda e sugestão de compra                                                                                        | Histórico de vendas, decisão sobre IA e custo |

Cada subprojeto segue o mesmo ciclo do subprojeto 1: spec, plano, execução com revisão por tarefa e revisão final.
