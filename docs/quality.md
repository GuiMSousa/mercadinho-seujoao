# Qualidade

## Comandos

| Comando                | O que prova                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check` | Formatação Prettier (padrões; ignora lockfile, skills vendorizadas, grafo e `AGENTS.md`, que o `next dev` reescreve)                                                                   |
| `npm run lint`         | Presets oficiais do Next.js (core-web-vitals + TypeScript) e as regras locais: 350 linhas, sem `console` direto, fronteira de dados e guardas Drizzle de `update`/`delete` sem `where` |
| `npm run typecheck`    | `next typegen` (tipos de rotas) seguido de `tsc --noEmit` estrito                                                                                                                      |
| `npm run lint:typed`   | `@typescript-eslint/no-floating-promises` e `no-misused-promises` como **erro** em `src/**`. Custo medido nesta máquina: 3,1 s e pico de ~669 MB                                       |
| `npm run lint:rules`   | Autoteste das regras locais com o `RuleTester` do ESLint                                                                                                                               |
| `npm test`             | Vitest em Node: ambiente, logger e pool, mais autenticação (senha, sessão, regra de acesso, rate limit, proxy e rotas), sem banco                                                      |
| `npm run spec:check`   | Contrato OpenAPI 3.1 válido (`@apidevtools/swagger-parser`), igual ao `src/contracts/openapi.json` versionado e cobrindo exatamente os métodos exportados em `src/app/api/**/route.ts` |
| `npm run build`        | Build de produção `standalone` sem credenciais                                                                                                                                         |
| `npm run check`        | Tudo acima, na mesma ordem do CI (`.github/workflows/ci.yml`)                                                                                                                          |

Rode `npm test` (ou um arquivo de teste específico) durante o desenvolvimento e `npm run check` antes de concluir uma tarefa. O CI usa `npm ci` em Node 24 (`.nvmrc`) sem segredos.

## Regras de base

- TypeScript estrito e presets oficiais do framework.
- Limite de 350 linhas e organização proporcional ao comportamento.
- Log estruturado no servidor; apresentação sem acesso direto a dados.
- Com Drizzle, guardas de `update`/`delete` sem `where` e revisão de queries e migrations.
- Validação de entrada e ambiente, erros sem segredos e testes de fronteira relevantes.
- Aderência ao design system ([DESIGN.md](../DESIGN.md)): o ESLint barra hex, funções de cor, `px`, valores arbitrários em utilitários de cor, tipo, espaço e raio, `fontFamily`, o import do pacote `cn` puro e imports de `design-system/references`.

## Estratégia de testes

- **Hoje existem:** 45 testes em 16 arquivos, todos sem banco (mocks de `pg`, `server-only` e, nas rotas, do service).
  - Fronteiras: ambiente (inclui `SESSION_SECRET` com 32+ caracteres sem ecoar o valor), logger e pool.
  - Autenticação:
    - hash scrypt;
    - JWT, que recusa token adulterado, sem assinatura (`alg: none`) ou expirado;
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
- **Banco real:** ainda não há testes automatizados de repository contra o PostgreSQL. A migration e o fluxo de login foram validados manualmente contra o Compose (ver [setup.md](setup.md)).
- **`test:e2e`:** entra com o primeiro fluxo de tela (E2E em navegador). Não existe agora e não é simulado.
- **Capacidades adotadas e evidência atual** (detalhes em [setup.md](setup.md)):

  | Capacidade    | Evidência atual                                                                                                                                                                                     |
  | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Runtime Next  | Preflight do `/_next/mcp` ok (`get_compilation_issues`, `get_routes`); `agent-browser` ausente                                                                                                      |
  | Bundle        | `next analyze` suportado; nenhuma auditoria feita                                                                                                                                                   |
  | SQL           | Migration `0000` gerada, revisada e aplicada no PostgreSQL local                                                                                                                                    |
  | CI            | Configurado, sem execução remota                                                                                                                                                                    |
  | Segurança     | Prompt registrado abaixo, nenhuma revisão feita                                                                                                                                                     |
  | Design system | Vitrine `/design-system` conferida no navegador (Playwright, 2026-10-28): temas claro e escuro, diálogo, teclado numérico, seleção, foco e console sem erros. Referências servidas por HTTP sem 404 |

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
  - sessão JWT, CSRF e limite de login;
  - CSP;
  - integridade de caixa e venda (transações, caixa único);
  - importação de planilhas.
- **Histórico:** nenhuma revisão executada ainda. A primeira deve acompanhar a entrega de autenticação.

## Dependências e entrega

- `npm audit --omit=dev` (produção): **0 vulnerabilidades** em 2026-10-28.
- `npm audit` (completo): 7 advisories (3 baixas, 4 moderadas), todas em ferramentas de desenvolvimento:

  | Advisory                                | Origem                                               | Impacto aqui                                                       |
  | --------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
  | `esbuild` ≤ 0.24.2, GHSA-67mh-4wv8-2f99 | Via `@esbuild-kit/*` dentro do `drizzle-kit` 0.31.11 | Afeta só o servidor de desenvolvimento do esbuild, que não é usado |
  | `deepmerge`, GHSA-gcqx-w48m-w2h4        | Via CLI `shadcn`                                     | Só no CLI de dev                                                   |

  As "correções" do npm são downgrades major (`drizzle-kit@0.18.1`, `shadcn@1.0.0`) e não foram aplicadas. Reavalie quando `drizzle-kit` ou `shadcn` publicarem versões sem essas dependências.

- Checks são comandos explícitos. Não há hooks Git, bloqueio de push nem exigência de branch. Atualize este documento junto com scripts e regras.
