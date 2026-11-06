# Qualidade

## Comandos

| Comando                | O que prova                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check` | Formatação Prettier (padrões; ignora lockfile, skills vendorizadas, grafo e `AGENTS.md`, que o `next dev` reescreve)                                                                   |
| `npm run lint`         | Presets oficiais do Next.js (core-web-vitals + TypeScript) e as regras locais: 350 linhas, sem `console` direto, fronteira de dados e guardas Drizzle de `update`/`delete` sem `where` |
| `npm run typecheck`    | `next typegen` (tipos de rotas) seguido de `tsc --noEmit` estrito                                                                                                                      |
| `npm run lint:typed`   | `@typescript-eslint/no-floating-promises` e `no-misused-promises` como **erro** em `src/**`. Custo medido nesta máquina: 3,1 s e pico de ~669 MB                                       |
| `npm run lint:rules`   | Autoteste das regras locais com o `RuleTester` do ESLint                                                                                                                               |
| `npm test`             | Vitest em Node: ambiente, logger e pool, mais autenticação, painel, catálogo, Service Worker e design system, sem banco                                                                |
| `npm run spec:check`   | Contrato OpenAPI 3.1 válido (`@apidevtools/swagger-parser`), igual ao `src/contracts/openapi.json` versionado e cobrindo exatamente os métodos exportados em `src/app/api/**/route.ts` |
| `npm run build`        | Build de produção `standalone` sem credenciais                                                                                                                                         |
| `npm run check`        | Tudo acima, na mesma ordem do CI (`.github/workflows/ci.yml`)                                                                                                                          |

Rode `npm test` (ou um arquivo de teste específico) durante o desenvolvimento e `npm run check` antes de concluir uma tarefa. O CI também confere o drift do schema: roda `npx drizzle-kit generate` e falha se `git status --porcelain -- drizzle` mostrar qualquer mudança (inclusive migration nova não commitada); localmente, rode o mesmo antes de commitar mudanças de schema. O CI usa `npm ci` em Node 24 (`.nvmrc`) sem segredos.

## Regras de base

- TypeScript estrito e presets oficiais do framework.
- Limite de 350 linhas e organização proporcional ao comportamento.
- Log estruturado no servidor; apresentação sem acesso direto a dados.
- Com Drizzle, guardas de `update`/`delete` sem `where` e revisão de queries e migrations.
- Validação de entrada e ambiente, erros sem segredos e testes de fronteira relevantes.
- Aderência ao design system ([DESIGN.md](../DESIGN.md)): o ESLint barra hex, funções de cor, `px`, valores arbitrários em utilitários de cor, tipo, espaço e raio, `fontFamily`, o import do pacote `cn` puro e imports de `design-system/references`.

## Estratégia de testes

- **Hoje existem** (2026-11-06): 312 testes em 84 arquivos sem banco (inclui os `.tsx`) (`npm test`; mocks de `pg`, `server-only` e, nas rotas, do service), mais 8 do contrato, e 124 testes em 18 arquivos com o PostgreSQL real (`npm run test:db`, banco `mkt_control_test`; quase todos em transação com rollback, e os 10 testes de concorrência fazem commit com dados únicos e apagam o que criaram).
  - Fronteiras: ambiente (sem ecoar valores), logger e pool.
  - Autenticação:
    - hash scrypt;
    - sessões no banco (expiração, ociosidade por loja, usuário inativo, renovação deslizante com "manter conectado" e revogação das outras sessões), com teste contra o PostgreSQL real em `sessions.db.test.ts`;
    - regra de acesso;
    - rate limit com janela e limite de memória;
    - proxy;
    - rotas de login, logout e `admin/users`.
  - Design system: contrato `DESIGN.md` ↔ `design-system/tokens.css` (todo token documentado, com o mesmo valor nos dois temas, e `globals.css` sem cor crua nem px), `cn` com as escalas do DS, centavos em pt-BR e teclado numérico.
  - Contraste (`design-system/contrast.test.ts`, desde 2026-11-06): calcula a razão WCAG de cada par de tokens que os componentes juntam, nos temas claro e escuro, e exige 4,5:1. Os pares são:
    - textos, valores e palavras de status sobre as três superfícies;
    - selos e semáforo (texto do tom sobre a tinta, sobre qualquer superfície);
    - botões em repouso e em hover;
    - item atual da barra lateral;
    - aviso (toast).

    Na primeira execução, o teste achou 3 pares abaixo de 4,5:1, corrigidos nos tokens: `danger-fg` sobre o hover do botão de perigo (4,35, claro); texto branco sobre o hover do `brand` (2,86, escuro); texto secundário do aviso (4,49, escuro).

  - Os dois critérios do produto têm testes próprios:
    - `CASHIER` bloqueado em rotas `ADMIN`: `src/proxy.test.ts` e `src/app/api/admin/users/route.test.ts`;
    - 429 no 11º login: `src/app/api/auth/login/route.test.ts`;
    - venda com dois lotes baixa primeiro o de validade mais próxima, e o total com item pesável é a soma dos itens arredondados: `src/domains/sales/sales.db.test.ts` e `src/app/caixa/cart.test.ts`;
    - sem caixa aberto o servidor recusa a venda, e o fechamento cego não devolve o esperado, que o administrador vê com a quebra: `src/domains/sales/sales.db.test.ts`, `src/domains/cash/cash.db.test.ts` e `src/app/api/cash/close/route.test.ts`;
    - faturamento, CMV gravado, lucro bruto, margem, ticket e formas de pagamento por dia do fuso da loja (venda às 23h30 locais no dia certo), lidos de um único instante: `src/domains/reports/reports.db.test.ts` e `src/domains/reports/finance.test.ts`;
    - produtos no mínimo ou abaixo (ou vencendo em até 30 dias) entram na reposição com 2 × mínimo − estoque, agrupados pelo fornecedor padrão: `src/domains/suppliers/suppliers.db.test.ts`;
    - a baixa manual repetida com o mesmo id, em sequência ou ao mesmo tempo, tira o estoque uma vez: `src/domains/inventory/write-off.db.test.ts`;
    - etiqueta de balança por peso (`21`) e por valor (`20`): leitura com dígito verificador, EAN comum ignorado, peso por valor nunca acima do valor impresso, e a venda no banco ao preço do catálogo com baixa PVPS em gramas: `src/lib/barcode-scale.test.ts`, `src/app/caixa/sale-api.test.ts` e `src/domains/sales/sales.db.test.ts`.
  - **Checagem por mutação** (2026-11-06): o teste da etiqueta matou 4 mutantes, e o código voltou ao original depois de cada um:
    - arredondar o peso por valor para o grama mais próximo, em vez de para baixo;
    - não conferir o dígito verificador;
    - aceitar qualquer segundo dígito no prefixo;
    - aceitar a etiqueta num produto vendido por unidade.
  - **Checagem por mutação** (2026-11-05): sem o `FOR UPDATE` da baixa PVPS, o teste de duas vendas concorrentes pelas últimas unidades falhou (a perdedora quebrava o CHECK de quantidade, um 500); restaurado o lock, voltou a passar. No caixa diário, sem o `FOR SHARE` da venda o teste da venda que espera o fechamento falhou, e sem o `FOR UPDATE` do fechamento o teste da venda em andamento ficou fora do esperado; restaurados, passaram.
  - **Checagem por mutação** (2026-10-28): com o limite trocado para 11 e a regra de perfil desligada, esses 3 testes falharam; restaurado o código, voltaram a passar.
- **Contrato:** as rotas devolvem DTOs parseados pelos schemas de `src/contracts`, e os testes de rota validam as respostas com os mesmos schemas. O `spec:check` garante que a spec cobre todas as rotas.
- **Por fluxo:** cada feature testa a regra de negócio no service, em Node puro (PVPS, total igual à soma dos itens arredondados, caixa único, sigilo de custo).
- **Banco real:** `npm run test:db` cobre sessões, cadastro (inclusive loja concorrente), recuperação de senha, usuários (último `ADMIN`), atividade, catálogo e baixa PVPS e o schema contra o PostgreSQL 18. Não faz parte de `npm run check`; o CI roda os dois.
- **`test:e2e`:** automatizado ainda não existe e não é simulado. O fluxo de telas tem um roteiro manual com resultados em [Roteiro E2E no navegador](#roteiro-e2e-no-navegador).
- **Capacidades adotadas e evidência atual** (detalhes em [setup.md](setup.md)):

  | Capacidade    | Evidência atual                                                                                                                                                                                     |
  | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Runtime Next  | Preflight do `/_next/mcp` ok (`get_compilation_issues`, `get_routes`); `agent-browser` ausente                                                                                                      |
  | Bundle        | `next analyze` suportado; nenhuma auditoria feita                                                                                                                                                   |
  | SQL           | Migrations `0000` a `0006` geradas e revisadas; `0005` (vendas) e `0006` (caixa diário) aplicadas nos bancos de teste, de E2E e de desenvolvimento                                                  |
  | CI            | Configurado, sem execução remota                                                                                                                                                                    |
  | Segurança     | Ciclos de revisão de segurança da autenticação concluídos (resumo abaixo)                                                                                                                           |
  | Design system | Vitrine `/design-system` conferida no navegador (Playwright, 2026-10-28): temas claro e escuro, diálogo, teclado numérico, seleção, foco e console sem erros. Referências servidas por HTTP sem 404 |

## Roteiro E2E no navegador

Executado em 2026-10-30 com o Playwright (MCP), contra `npm run dev -- -p 3100` num banco vazio `mkt_control_e2e` com as migrations `0000` a `0002` (preparação em [onboarding.md](onboarding.md#banco-do-teste-em-navegador)). Os códigos foram lidos do log do servidor (`mail (dev)`). Nenhum bug bloqueante foi encontrado. Ainda não há `test:e2e` automatizado: o roteiro é manual e deve ser repetido quando o fluxo de telas mudar.

Desde 2026-11-03, `/` mostra a landing pública a quem não é `ADMIN`. Ao repetir o roteiro, abra `/login` no passo 1.

| #   | Passo                                                                                                                                  | Resultado | Evidência                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Banco limpo: `/` leva a `/login`, com "Criar conta da loja" e os botões de demonstração (dev)                                          | Passou    | Redirecionou para `/login`; botões presentes                                                                                                        |
| 2   | Cadastro em 3 etapas; o foco vai para o `h1` de cada etapa; e-mail com espaços e maiúsculas vira `ana@teste.com`                       | Passou    | Foco em `H1:Dados da loja` e `H1:Confirme seu e-mail`; botão "Reenviar código em 60 s"; o e-mail foi enviado a `ana@teste.com`                      |
| 3   | Código errado: erro no campo (`aria-invalid`); código certo cria a loja e abre `/painel` com a saudação                                | Passou    | "Código incorreto. Confira os números e tente novamente."; depois `/painel` com "Bom dia, Ana" e a loja no menu                                     |
| 4   | Convite de CASHIER em Usuários; e-mail repetido é recusado no campo                                                                    | Passou    | "Este e-mail já tem conta." com `aria-invalid`; convite com código no log e linha "Convite pendente"                                                |
| 5   | Link do convite `/recuperar?email=…&etapa=codigo` abre direto na etapa do código; o convidado define a senha (código aceito após 60 s) | Passou    | `h1` "Defina uma nova senha"; senha definida (o login seguinte deu 403, não 401)                                                                    |
| 6   | Login do CASHIER convidado é recusado com a mensagem de exclusividade                                                                  | Passou    | 403, sem `Set-Cookie`; "Este painel é exclusivo para administradores. Operadores usam o PDV."                                                       |
| 7   | "Já tenho um código" em `/recuperar` vai para a etapa do código                                                                        | Passou    | `h1` "Defina uma nova senha", foco no `h1`, texto citando `ana@teste.com`                                                                           |
| 8   | Salvar a loja sem mudar nada                                                                                                           | Passou    | Aviso "Nenhuma alteração para salvar" (sem ponto final)                                                                                             |
| 9   | Troca de senha com confirmação: divergência dá erro no campo; igual troca e mostra o aviso                                             | Passou    | "As senhas não conferem." com `aria-invalid`; aviso "Senha alterada"                                                                                |
| 10  | "Encerrar outras sessões" derruba o segundo contexto e mantém o primeiro                                                               | Passou    | Segundo contexto logado; após o clique, sua próxima navegação foi para `/login`; o primeiro recarregou `/painel/configuracoes`                      |
| 11  | Tema: setas selecionam; escuro persiste ao recarregar; "Sistema" limpa; cliques rápidos terminam no último                             | Passou    | `ArrowRight` em "Claro" deu `data-theme="dark"`, mantido após recarregar; "Sistema" removeu o atributo; Escuro e depois Claro terminou em `light`   |
| 12  | Aviso de erro (`danger`) é assertivo e tem botão de fechar                                                                             | Passou    | Com `/api/theme` bloqueado: `role="alertdialog"`, espelho `role=alert` do Base UI, botão "Fechar" remove o aviso; sem fechar, some sozinho em ~10 s |
| 13  | Gaveta em 390 px: sem rolagem horizontal, foco entra na gaveta, Tab fica dentro, Esc fecha e devolve o foco                            | Passou    | Barra lateral oculta, `scrollWidth <= clientWidth`; foco em "Fechar menu"; Tab percorreu os links; após Esc o foco voltou para "Abrir menu"         |
| 14  | Sair volta a `/login`, e "Criar conta da loja" não aparece mais; `/painel` sem sessão leva a `/login`                                  | Passou    | `/login` sem o botão (já existe loja); redirecionamento do guarda                                                                                   |
| 15  | "Sair" com a sessão já apagada no banco leva a `/login`                                                                                | Passou    | `DELETE FROM sessions` no banco do E2E; o clique recebeu 401 de `/api/auth/logout` e a página foi para `/login`                                     |

Observação: na etapa 3 do cadastro, o texto "enviado para …" mostra o e-mail como digitado (`Ana@Teste.com`), enquanto o envio e a conta usam a forma normalizada.

### Catálogo e estoque

Executado em 2026-11-03 com o Playwright (MCP), contra `npm run dev -- -p 3100` no banco `mkt_control_e2e`, com 25 produtos e lotes em cada faixa do semáforo. O `usePagedList` não tem teste automatizado, porque o repositório não usa jsdom; este roteiro o cobre.

| #   | Passo                                                                                                                  | Resultado |
| --- | ---------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | `/admin/products` e `/admin/inventory` levam a `/painel/produtos` e `/painel/estoque`                                  | Passou    |
| 2   | 25 produtos: 20 na página 1, 5 na 2; "Próxima" na última página mantém o foco e não muda                               | Passou    |
| 3   | Busca lenta respondendo depois de uma busca mais nova não sobrescreve o resultado                                      | Passou    |
| 4   | Editar um produto atualiza a lista mantendo a busca e a página                                                         | Passou    |
| 5   | Semáforo: vencido e 7 dias em vermelho; 8 e 30 dias, ou no mínimo, em amarelo; 31 em verde                             | Passou    |
| 6   | Foco abre no primeiro campo; Enter do leitor no código de barras não envia nem fecha                                   | Passou    |
| 7   | Com o salvamento em andamento, Esc não fecha e Cancelar fica desabilitado                                              | Passou    |
| 8   | Sessão `CASHIER`: `/api/admin/*` e `/painel/*` 403; `/api/%61dmin/*` e `/%70ainel/*` 404                               | Passou    |
| 9   | Em 375 px, sem rolagem lateral na página, e a tabela de produtos cabe na tela                                          | Passou    |
| 10  | Resposta perdida na entrada de lote: reenviar igual não soma estoque de novo; reenviar com outra quantidade é recusado | Passou    |

Desempenho medido com `EXPLAIN ANALYZE` em 5.000 produtos e 50.000 lotes: 12,7 ms para a primeira página e 5,5 ms para uma busca.

### Frente de caixa

Executado em 2026-11-05 com o Playwright (Edge, script local), contra o build de produção (`next build` e `next start -p 3100`) no banco `mkt_control_e2e`. Os produtos de teste cobrem um item normal, um pesável, um com lote vencido e um sem estoque. Em `next dev` o CSS da impressão chegou desatualizado (cache do Turbopack), por isso a conferência final usou o build.

| #   | Passo                                                                                                              | Resultado |
| --- | ------------------------------------------------------------------------------------------------------------------ | --------- |
| 1   | Login de `CASHIER` vai para `/caixa`, com o foco na busca                                                          | Passou    |
| 2   | Código digitado rápido com Enter (leitor) adiciona; o mesmo código de novo soma na linha                           | Passou    |
| 3   | Próximo lote vencido e produto sem saldo são recusados com toast de perigo                                         | Passou    |
| 4   | Pesável abre o teclado numérico; dígitos do teclado físico viram 1,250 kg e Enter confirma                         | Passou    |
| 5   | Total 2 × R$ 18,49 + 1,250 kg × R$ 6,99 = R$ 45,72 (item arredondado ao centavo)                                   | Passou    |
| 6   | Leitura com o foco num botão do carrinho vai para a busca e não clica o botão                                      | Passou    |
| 7   | "+" não passa do saldo e avisa                                                                                     | Passou    |
| 8   | Busca por nome lista os produtos com saldo, "Sem estoque" e "Lote vencido"; Esc limpa                              | Passou    |
| 9   | Preço alterado pelo administrador durante a venda: o servidor recusa, a tela mostra o novo total, e Enter finaliza | Passou    |
| 10  | Troco de R$ 31,29 sobre R$ 100,00; foco em "Nova venda"; link do WhatsApp com o comprovante                        | Passou    |
| 11  | Na impressão só o comprovante aparece                                                                              | Passou    |
| 12  | "Nova venda" esvazia a venda e devolve o foco à busca; F2 sem itens avisa                                          | Passou    |
| 13  | Botão de finalizar com 60 px e busca com texto de 22 px                                                            | Passou    |
| 14  | Baixa manual no painel vem preenchida com a quantidade vencida e "Lote vencido"; depois, o produto vende           | Passou    |
| 15  | Cancelar a venda pede confirmação e esvazia                                                                        | Passou    |
| 16  | `CASHIER` em `/painel/estoque` vai para `/caixa`; `/api/admin` responde 403                                        | Passou    |
| 17  | Em 375 px, sem rolagem lateral; tema escuro conferido na captura                                                   | Passou    |
| 18  | Console sem erros, fora o 409 e o 403 provocados pelo roteiro                                                      | Passou    |

Não verificado: leitor físico, impressora térmica real, WhatsApp aberto de fato e leitor de tela. O 11º login seguido do mesmo IP recebeu 429 durante as repetições do roteiro, como esperado.

### Caixa diário

Executado em 2026-11-05 com o Playwright (Edge, script local), contra o build de produção no banco `mkt_control_e2e`.

| #   | Passo                                                                                                             | Resultado |
| --- | ----------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Caixa fechado: `/caixa` mostra só a abertura, sem busca                                                           | Passou    |
| 2   | `POST /api/sales` com o caixa fechado responde 422 "Não é possível realizar vendas com o caixa fechado."          | Passou    |
| 3   | Abertura com R$ 100,00 pelo teclado mostra a venda e "Caixa aberto em" no cabeçalho                               | Passou    |
| 4   | Venda em dinheiro (R$ 18,49) e venda em Pix                                                                       | Passou    |
| 5   | F8: sangria sem motivo é recusada; com motivo, R$ 30,00 registrados                                               | Passou    |
| 6   | Botão "Caixa": suprimento de R$ 5,00                                                                              | Passou    |
| 7   | F4 com venda em andamento pede para finalizar ou cancelar antes                                                   | Passou    |
| 8   | Fechamento cego com R$ 93,00: o esperado (R$ 93,49) não aparece em lugar nenhum da tela; depois, volta a abertura | Passou    |
| 9   | Painel: esperado R$ 93,49, contado R$ 93,00 e "Falta de R$ 0,49", com o último fechamento em destaque             | Passou    |
| 10  | Detalhe: troco, vendas em dinheiro (sem o Pix), suprimentos, sangrias e as movimentações com motivo               | Passou    |
| 11  | Em 375 px, sem rolagem lateral; console sem erros fora o 422 provocado                                            | Passou    |

### Relatórios

Executado em 2026-11-05 com o Playwright (Edge, script local), contra o build de produção no banco `mkt_control_e2e`, depois do roteiro do caixa (uma venda de R$ 18,49 em dinheiro e outra em Pix, custo de R$ 12,90 cada). O servidor rodou sem `RESEND_API_KEY`: nenhum e-mail real foi enviado.

| #   | Passo                                                                                                    | Resultado |
| --- | -------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Hoje: faturamento R$ 36,98, CMV R$ 25,80, lucro R$ 11,18, margem 30,2% com selo "Boa", ticket R$ 18,49   | Passou    |
| 2   | 2 vendas e 2 itens; Dinheiro e Pix com 50,0% cada, débito e crédito zerados                              | Passou    |
| 3   | Mais vendidos: PDV Café 500 g, 2 un, R$ 36,98; histórico com CMV R$ 12,90 e margem 30,2% em cada venda   | Passou    |
| 4   | Últimos 7 dias cobre de 30/10 a 05/11; período livre recusa fim antes do início                          | Passou    |
| 5   | Um dia sem vendas mostra zeros, margem "—" com "Sem vendas" e histórico vazio                            | Passou    |
| 6   | Resumo por e-mail sem chave do Resend em produção: recusado com "Não foi possível enviar o e-mail agora" | Passou    |
| 7   | `CASHIER` em `/painel/relatorios` vai para `/caixa`; `/api/admin/reports` responde 403                   | Passou    |
| 8   | Em 375 px, sem rolagem lateral; tema escuro conferido; console sem erros fora o 502 provocado            | Passou    |

O conteúdo do e-mail (valores, nomes escapados e HTML enviado ao Resend) é coberto por `reports.db.test.ts` e `mail.test.ts`, com o envio simulado.

### Fornecedores e reposição

Executado em 2026-11-05 com o Playwright (Edge, script local), contra o build de produção no banco `mkt_control_e2e`. Os roteiros do caixa (15 passos), dos relatórios e do PDV (31 passos) foram repetidos no mesmo build, sem regressão.

| #   | Passo                                                                                                     | Resultado |
| --- | --------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Cadastro de fornecedor recusa CNPJ incompleto, mascara o CNPJ e lista contato e WhatsApp                  | Passou    |
| 2   | CNPJ repetido é recusado no campo                                                                         | Passou    |
| 3   | No produto, o código no fornecedor só abre com um fornecedor escolhido; fornecedor padrão e mínimo salvos | Passou    |
| 4   | Reposição: PDV Café (5 em estoque, mínimo 10) no grupo do fornecedor, comprar 15 un                       | Passou    |
| 5   | "Enviar pedido" abre `wa.me/5511987654321` com loja, contato, código CF-500 e 15 un                       | Passou    |
| 6   | Produtos sem fornecedor padrão (iogurte vencido, arroz zerado) ficam num grupo à parte                    | Passou    |
| 7   | Fornecedor inativado: o café passa para o grupo sem fornecedor                                            | Passou    |
| 8   | Período livre dos relatórios usa a regra e a mensagem da API                                              | Passou    |
| 9   | Em 375 px, sem rolagem lateral; `CASHIER` vai para `/caixa` e recebe 403 em `/api/admin/suppliers`        | Passou    |
| 10  | Console sem erros, fora o 422 e o 409 provocados                                                          | Passou    |

### Etiqueta de balança e revisão de interface (semana 7)

Executado em 2026-11-06 com o Playwright (Edge, script local), contra o build de produção (`next build` e `next start -p 3100`) no banco `mkt_control_e2e`. O roteiro usou a picanha `00777` a R$ 80,00/kg, com 5 kg em lote, e o pão `00778` vendido por unidade. Antes, uma página de teste com um defeito plantado conferiu os 3 detectores: um elemento de 600 px, um botão de 40 px e um campo de 14 px. Os três acusaram o defeito.

| #   | Passo                                                                                                                                                                     | Resultado |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Etiqueta por peso (`21`, 1500 g) entra como 1,500 kg sem abrir a janela de peso                                                                                           | Passou    |
| 2   | Etiqueta por valor (`20`, R$ 23,47) entra como 293 g e soma na linha: 1,793 kg, total R$ 143,44                                                                           | Passou    |
| 3   | Etiqueta com código sem cadastro avisa com o código de 5 dígitos; etiqueta de produto por unidade é recusada; dígito verificador errado não é lido como etiqueta          | Passou    |
| 4   | Venda em dinheiro ao preço do catálogo: 1,793 kg, R$ 143,44, troco de R$ 56,56 sobre R$ 200,00                                                                            | Passou    |
| 5   | No formulário de produto vendido por quilo, a dica do código de 5 dígitos da balança aparece                                                                              | Passou    |
| 6   | Balcão com 60 px ou mais em todo controle (só os botões "Fechar" de diálogo e aviso ficam de fora). Conferido em 1366 px e em 375 px, nas telas e janelas listadas abaixo | Passou    |
| 7   | Em 375 px, sem rolagem lateral e com campos de 16 px ou mais, em todas as rotas e janelas listadas abaixo                                                                 | Passou    |
| 8   | Console sem erros, fora os 404 e 422 provocados                                                                                                                           | Passou    |

Telas e janelas do passo 6:

- abertura do caixa, venda com itens e cabeçalho;
- janelas de caixa, peso, pagamento e comprovante;
- entrada de lote e baixa de estoque.

Rotas e janelas do passo 7:

- públicas: `/`, `/login`, `/cadastro`, `/recuperar` e `/design-system`;
- `ADMIN`: `/caixa` e todas as `/painel/*`;
- `CASHIER`: `/caixa` com itens, e a janela de pagamento;
- janelas de produto, fornecedor e entrada de lote, e a gaveta do menu aberta.

Correções da revisão:

- **Cabeçalho do PDV:** os botões Caixa, Painel, tema e Sair foram para 60 px, e no celular mostram só o ícone, com o nome mantido para leitor de tela.
- **Outros botões do balcão:** "Cancelar venda", Imprimir e WhatsApp do comprovante foram para 60 px.
- **Campos e caixa de seleção:** o "Item não vence" da entrada de lote ganhou uma linha de toque de 60 px; o campo de observações do fechamento, 60 px; e os campos `sm`, 16 px.

Não verificado: balança e leitor físicos, e leitor de tela.

## Harness (método nativo inspirado no Harness2)

- **Modo:** adaptação nativa do método do toolkit (`docs/tools/23-harness2.md`). Comparações limitadas no próprio agente, com o cliente, modelo e autenticação atuais. Não executa o framework Harness2 nem reproduz seus resultados. A CLI oficial não foi selecionada.
- **Como reutilizar:** no agente do projeto, peça:

  ```text
  Leia https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/790a895304e0c08b70a5b215c9d334f1c86b816c/docs/prompts/15-harness-improvement.md e execute o bloco Prompt neste projeto.
  ```

  O link fixa a revisão do toolkit `790a895`. Para atualizar, troque a revisão e revise o diff do prompt.

- **Quando rodar:** casos de smoke (`docs/07-harness-evaluation.md` do toolkit) após mudanças em instruções, memória, skills ou orquestração, sempre em cópias descartáveis fora do repositório. Uma falha observada justifica uma comparação candidata; sem falha, nada muda.
- **Resultados iniciais:** ver [setup.md](setup.md#memória-e-harness). Um caso que passa é smoke, não garantia de confiabilidade.

## Revisão após implementação ou correções

Escolha o escopo da revisão pelo risco e pelo diff real. Use revisão independente em trabalho não trivial quando houver. Registre o alvo exato, os chamadores, contratos e testes conectados, os achados confirmados e a cobertura. Pare quando os achados relevantes estiverem resolvidos ou decididos e os checks afetados passarem; uma contagem pedida pelo usuário é respeitada sem ser reiniciada.

## Revisão de segurança

- **Prompt adotado:** bloco "Prompt" de `docs/prompts/13-security-review.md` do toolkit, revisão `790a895`. Invocação:

  ```text
  Leia https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/790a895304e0c08b70a5b215c9d334f1c86b816c/docs/prompts/13-security-review.md e execute o bloco "Prompt" neste repositório. Use modo repositório, preserve meu cliente/modelo/autenticação e salve um relatório redigido fora do repositório.
  ```

  Para revisar um diff, troque o modo por `Use diff mode, base=<ref>, head=<ref>, comparison=endpoint|merge-base, dirty=exclude|include`. A skill `differential-review` complementa o modo diff.

- **Limites:** somente leitura; nada de correções automáticas, checkout, scanners de rede ou acesso a produção.
- **Relatório:** privado, fora do repositório (ex.: `%LOCALAPPDATA%\security-reviews\mkt-control-<data>.md`), redigido, sem segredos. Nada sensível entra neste repositório; aqui fica só data, escopo e status.
- **Prioridades deste produto:**
  - sigilo de custo, CMV e margem para `CASHIER`;
  - autorização no servidor;
  - sessão no banco, CSRF e limite de login;
  - CSP;
  - integridade de caixa e venda (transações, caixa único);
  - importação de planilhas.
- **Histórico:** a entrega de autenticação passou por cinco ciclos de revisão (2026-10-29 e 2026-10-30), com achados corrigidos e testes de regressão: sessão por hash SHA-256, token CSRF obrigatório, `ADMIN` exclusivo no painel, cadastro preso ao navegador por nonce, tentativas de código gastas de forma atômica, CHECKs de e-mail em minúsculas e de loja única (migration `0002`), cabeçalhos de segurança, mensagens sem enumeração de contas e proteção do último `ADMIN` contra corrida. Relatórios completos ficam fora do repositório. Não houve varredura de rede nem teste em produção; CSP, importação de planilhas e sigilo de custo ainda não têm código para revisar.

## Dependências e entrega

- `npm audit --omit=dev` (produção): **0 vulnerabilidades** em 2026-10-28.
- `npm audit` (completo): 7 advisories (3 baixas, 4 moderadas), todas em ferramentas de desenvolvimento:

  | Advisory                                | Origem                                               | Impacto aqui                                                       |
  | --------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
  | `esbuild` ≤ 0.24.2, GHSA-67mh-4wv8-2f99 | Via `@esbuild-kit/*` dentro do `drizzle-kit` 0.31.11 | Afeta só o servidor de desenvolvimento do esbuild, que não é usado |
  | `deepmerge`, GHSA-gcqx-w48m-w2h4        | Via CLI `shadcn`                                     | Só no CLI de dev                                                   |

  As "correções" do npm são downgrades major (`drizzle-kit@0.18.1`, `shadcn@1.0.0`) e não foram aplicadas. Reavalie quando `drizzle-kit` ou `shadcn` publicarem versões sem essas dependências.

- Checks são comandos explícitos. Não há hooks Git, bloqueio de push nem exigência de branch. Atualize este documento junto com scripts e regras.
