# Qualidade

## Comandos

| Comando                | O que prova                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check` | Formatação Prettier (padrões; ignora lockfile, skills vendorizadas, grafo e `AGENTS.md`, que o `next dev` reescreve)                                                                   |
| `npm run lint`         | Presets oficiais do Next.js (core-web-vitals + TypeScript) e as regras locais: 350 linhas, sem `console` direto, fronteira de dados e guardas Drizzle de `update`/`delete` sem `where` |
| `npm run typecheck`    | `next typegen` (tipos de rotas) seguido de `tsc --noEmit` estrito                                                                                                                      |
| `npm run lint:typed`   | `@typescript-eslint/no-floating-promises` e `no-misused-promises` como **erro** em `src/**`. Custo medido nesta máquina: 3,1 s e pico de ~669 MB                                       |
| `npm run lint:rules`   | Autoteste das regras locais com o `RuleTester` do ESLint                                                                                                                               |
| `npm test`             | Vitest em Node: ambiente, logger e pool, mais autenticação, painel e design system, sem banco                                                                                          |
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

- **Hoje existem** (2026-11-03): 226 testes em 59 arquivos sem banco (inclui os `.tsx`) (`npm test`; mocks de `pg`, `server-only` e, nas rotas, do service) e 77 testes em 13 arquivos com o PostgreSQL real (`npm run test:db`, banco `mkt_control_test`; quase todos em transação com rollback, e os 4 testes de concorrência fazem commit com dados únicos e apagam o que criaram).
  - Fronteiras: ambiente (sem ecoar valores), logger e pool.
  - Autenticação:
    - hash scrypt;
    - sessões no banco (expiração, ociosidade por loja, usuário inativo, renovação deslizante com "manter conectado" e revogação das outras sessões), com teste contra o PostgreSQL real em `sessions.db.test.ts`;
    - regra de acesso;
    - rate limit com janela e limite de memória;
    - proxy;
    - rotas de login, logout e `admin/users`.
  - Design system: contrato `DESIGN.md` ↔ `design-system/tokens.css` (todo token documentado, com o mesmo valor nos dois temas, e `globals.css` sem cor crua nem px), `cn` com as escalas do DS, centavos em pt-BR e teclado numérico.
  - Os dois critérios do produto têm testes próprios:
    - `CASHIER` bloqueado em rotas `ADMIN`: `src/proxy.test.ts` e `src/app/api/admin/users/route.test.ts`;
    - 429 no 11º login: `src/app/api/auth/login/route.test.ts`.
  - **Checagem por mutação** (2026-10-28): com o limite trocado para 11 e a regra de perfil desligada, esses 3 testes falharam; restaurado o código, voltaram a passar.
- **Contrato:** as rotas devolvem DTOs parseados pelos schemas de `src/contracts`, e os testes de rota validam as respostas com os mesmos schemas. O `spec:check` garante que a spec cobre todas as rotas.
- **Por fluxo:** cada feature testa a regra de negócio no service, em Node puro (PVPS, total igual à soma dos itens arredondados, caixa único, sigilo de custo).
- **Banco real:** `npm run test:db` cobre sessões, cadastro (inclusive loja concorrente), recuperação de senha, usuários (último `ADMIN`), atividade e o schema contra o PostgreSQL 18. Não faz parte de `npm run check`; o CI roda os dois.
- **`test:e2e`:** automatizado ainda não existe e não é simulado. O fluxo de telas tem um roteiro manual com resultados em [Roteiro E2E no navegador](#roteiro-e2e-no-navegador).
- **Capacidades adotadas e evidência atual** (detalhes em [setup.md](setup.md)):

  | Capacidade    | Evidência atual                                                                                                                                                                                     |
  | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Runtime Next  | Preflight do `/_next/mcp` ok (`get_compilation_issues`, `get_routes`); `agent-browser` ausente                                                                                                      |
  | Bundle        | `next analyze` suportado; nenhuma auditoria feita                                                                                                                                                   |
  | SQL           | Migrations `0000` a `0004` geradas, revisadas e aplicadas no PostgreSQL local e no banco de testes                                                                                                  |
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
