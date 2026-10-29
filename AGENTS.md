<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Mkt Control — instruções para agentes

## Produto e stack

- Escopo, regras de negócio e pendências: [PRODUCT.md](PRODUCT.md). Ele prevalece em decisões de produto.
- Stack: Next.js 16.4 (App Router, Turbopack), React 19.3, TypeScript 5.9 estrito, Tailwind 4, shadcn/ui (`base-nova`, Base UI) com Lucide e design system próprio em `design-system/`, Drizzle ORM 0.45 com PostgreSQL 18 (`pg`), Zod 4, Pino 10, Vitest 5, Prettier 3. Node.js 24 LTS (`.nvmrc`) e npm 11 com `package-lock.json`.
- Setup, versões e evidências: [docs/setup.md](docs/setup.md).

## Comandos canônicos

- Instalar: `npm ci`
- Banco local: `npm run db:up` / `npm run db:down` (Docker Compose com `.env.local`)
- Desenvolver: `npm run dev`
- Formatação: `npm run format` / `npm run format:check`
- Lint: `npm run lint`
- Tipos: `npm run typecheck` (`next typegen` + `tsc`)
- Lint tipado (promises): `npm run lint:typed`
- Autoteste das regras locais: `npm run lint:rules`
- Testes: `npm test`
- Build: `npm run build`
- Migrations: `npm run db:generate` (gera SQL sem conectar; revise) e `npm run db:migrate` (só no destino autorizado)
- Verificação completa: `npm run check` (não conecta ao banco nem aplica migrations)
- Contrato OpenAPI: `npm run spec:check` (spec válida, igual ao `openapi.json` versionado e cobrindo toda rota de `src/app/api`); depois de mudar contratos ou rotas, `npm run spec:generate`
- Criar usuário: `npm run user:create -- <usuario> <ADMIN|CASHIER>` (senha aleatória exibida uma vez; precisa do banco migrado)
- E2E (`test:e2e`): ainda não existe; entra com o primeiro fluxo de tela.

## Acordos de trabalho

- Leia o código e as instruções relevantes antes de editar. Explicite premissas que mudam comportamento ou escopo.
- Entregue a menor mudança completa. Reuse padrões, componentes e dependências existentes.
- Preserve mudanças locais, validação, tratamento de erros, segurança, acessibilidade e requisitos explícitos.
- Não crie abstrações, camadas vazias, opções, dependências ou features não pedidas.
- Rode as verificações adequadas. Teste lógica relevante e regressões; mudanças triviais não precisam de teste espelho.
- Não transforme premissas em fatos, nem integrações pendentes em resultados simulados.
- Publicar, enviar mensagens a terceiros, gerar custos e ações destrutivas exigem autorização específica. Instalar ferramentas não concede essa autorização.

## Continuidade de execução

- Durante trabalho autorizado, responda a perguntas de status e retome o restante. Pare se o usuário pausar, cancelar ou mudar o objetivo.
- Um bloqueio para só as tarefas dependentes. Termine as independentes que continuem seguras e autorizadas.
- Se um agente falhar ou seu estado ficar incerto, confirme que ele parou antes de assumir seus arquivos. Retome de um ponto verificado.
- Não repita a mesma tentativa sem evidência nova. Respeite limites de custo, tempo, tentativas e negações.
- Ao retomar de um handoff, confira arquivos, Git, checks e processos reais.
- Trabalho de várias sessões ainda não terminado mantém um handoff curto no plano/tarefa: objetivo, estado verificado, checks, pendências, bloqueios e próxima ação.

## Padrões do código

- Organização: features em `src/domains/<feature>` (repository + service + teste), integrações em `src/infrastructure`, contratos (schemas Zod/OpenAPI) em `src/contracts`. Crie cada pasta só com o primeiro código real. Mapa atual em [docs/architecture.md](docs/architecture.md).
- Rotas e páginas finas: validam a entrada, chamam um service e devolvem um DTO. Services não importam `next/*`. Só repositories usam `getDb()` de `@/infrastructure/db`. O ESLint bloqueia o cliente de banco em `src/app`, `src/components` e qualquer `.tsx`.
- Persistência: Drizzle + PostgreSQL. Um único ponto de conexão (`src/infrastructure/db/index.ts`) com pool limitado e lazy. Gere e revise o SQL antes de aplicar migrations no destino autorizado; nunca migre em build ou em requisição.
- Valide entrada e ambiente com Zod. Use o logger Pino só no servidor, sem segredos nem corpos completos. Para console, `quality/no-direct-console` aponta o logger.
- Dinheiro em centavos inteiros e peso em gramas. O total da venda é a soma dos itens arredondados ao centavo (ver PRODUCT.md).
- Dados de custo, CMV e margem nunca vão a respostas acessíveis ao perfil `CASHIER`.
- Autenticação: toda rota de API começa com `guard(request)` (`src/app/api/_lib/guard.ts`), a mesma regra do `src/proxy.ts` (`accessDenial` em `src/domains/auth/access.ts`). Não confie só no proxy. Caminhos novos exigem sessão por padrão; exclusivos de `ADMIN` ficam em `/admin` ou `/api/admin`. Mutações autenticadas exigem o cabeçalho `x-csrf-token` igual ao cookie `mkt_csrf`.
- Toda rota nova de API entra no contrato (`src/contracts`) e no `openapi.json`; o `spec:check` falha se faltar.
- Consulte fontes oficiais atuais e canais estáveis antes de mudar stack ou APIs. Registre fonte, motivo e resultado em `docs/setup.md`.
- Responsabilidades dos documentos: `PRODUCT.md` é o escopo; `docs/architecture.md`, estrutura e decisões; `DESIGN.md`, contrato visual, interface e tokens; `docs/onboarding.md`, preparação; `docs/quality.md`, verificações. Atualize o documento responsável junto com a mudança.

## Interface e design system

- [DESIGN.md](DESIGN.md) é o contrato visual e a fonte da verdade dos tokens. Leia-o antes de mexer em UI. `design-system/tokens.test.ts` falha se `DESIGN.md` e `design-system/tokens.css` divergirem: token novo ou alterado muda os dois no mesmo commit.
- Componentes vêm de `@ds/components/*` (`design-system/components`): `Button`, `IconButton`, `Input`, `Select`, `Checkbox`, `Badge`, `Money`, `Card`, `Table`, `Dialog`, `Keypad`. Reuse-os antes de criar outro; o passo a passo para criar um novo está no `DESIGN.md`. Exemplos vivos na rota `/design-system`.
- Estilo só por tokens: cores semânticas (`bg-surface-card`, `text-strong`, `text-sub`, `bg-brand`, `*-fg`/`*-bg` de status), tipos `text-body-lg`/`text-body-md`/`text-h1`…, raios `rounded-control`/`rounded-card`, alturas `h-control-*`, sombras `shadow-(--shadow-sm)`. Sem hex, `rgb()`, `px`, rampas ou valores arbitrários em utilitários de cor, tipo, espaço e raio; o ESLint bloqueia.
- `cn` vem de `@ds/lib/cn`, nunca do pacote `cn`. Valores em dinheiro aparecem com `Money` (centavos inteiros).
- `design-system/references/` é a exportação original do Claude Design: especificação estática, nunca importada.

## Contexto e memória

Este arquivo é o índice de memória do projeto. Os detalhes ficam nos documentos canônicos acima, lidos sob demanda. Decisões duráveis entram no documento responsável com fonte, data de verificação e gatilho de revisão. Em conflito, confira o código atual e o documento responsável; atualize ou retire a entrada superada. A memória nativa por usuário dos clientes é complementar e não substitui estes arquivos.

## Ferramentas e estilo

- **Ponytail:** intensidade `full` para código. `stop ponytail` desativa.
- **Caveman:** conversa concisa no idioma do usuário (pt-BR). Código, documentação e commits usam redação normal. `stop caveman` desativa.
- **Superpowers:** use as skills relevantes na proporção do escopo. Instruções explícitas e execução já autorizada prevalecem sobre aprovações repetidas.
- **Context7:** documentação atual de APIs e bibliotecas, um conceito por consulta. Nunca envie segredos nem código privado.
- **RTK:** com hook nativo ativo, não envolva comandos duas vezes. Use `rtk proxy <comando>` quando precisar da saída original.
- **Graphify:** para perguntas estruturais, use o grafo em `graphify-out/` (gerado localmente, ignorado no Git). Regenere com `graphify extract . --code-only --no-cluster`. Registre evidência desatualizada.
- **LLMs:** preserve o cliente, o modelo e a autenticação nativos, inclusive no Graphify e no Caveman. Subagentes usam o modelo da sessão, passado explicitamente quando houver suporte. Não troque provedor nem habilite API paga ou proxy.

## Skills do projeto

Instaladas em `.agents/skills` (Codex) e `.claude/skills` (Claude Code), registradas em `skills-lock.json`. Detalhes em `docs/setup.md`.

- `vercel-react-best-practices`: ao escrever ou revisar React/Next.js (dados, renderização, bundle).
- `vercel-composition-patterns`: em decisões concretas de composição e API de componentes.
- `web-design-guidelines`: revisão de interface e acessibilidade antes de concluir mudanças de UI.
- `writing-guidelines`: revisão de documentação e textos.
- `vercel-react-view-transitions`: só para transições pedidas, compatíveis com as versões em uso.
- `vercel-optimize`, `deploy-to-vercel`, `vercel-cli-with-tokens`: só com tarefa e autorização de Vercel. O projeto roda no PC da loja, sem Vercel.
- `find-skills`: quando faltar uma capacidade concreta.
- `next-dev-loop`: feedback de runtime e navegador após mudanças. Exige `agent-browser` no PATH, que hoje não está instalado.
- `next-bundle-optimizer`: auditoria de bundle com evidência do analyzer (`next analyze`).
- `supabase-postgres-best-practices`: antes de trabalho de schema, SQL, migrations, segurança ou desempenho no PostgreSQL. Não adota Supabase.
- `gh-fix-ci` (só Codex): investigar falhas de GitHub Actions com acesso autorizado; siga a aprovação de correção da skill.
- `differential-review`: revisão de diffs sensíveis à segurança, com intervalo definido e relatório privado.
- `shadcn`: inspecione `components.json`, `DESIGN.md` e `design-system/` antes de alterar a UI. Adicione só os componentes necessários e adapte-os aos tokens.

Instalar uma skill não executa suas ações e não autoriza animações, cache, deploy ou mudança de arquitetura.

## Git e colaboração

- Sem hooks de pre-commit/pre-push, sem bloqueio de push no `main` e sem exigência de branch/worktree.
- Lint, tipos, testes e build são verificações explícitas (local e GitHub Actions).
- Delegue só quando isolamento de contexto, especialização ou paralelismo justificarem. Um escritor por arquivo; o coordenador cuida de lockfile, configuração compartilhada e integração. Revisores em paralelo são somente leitura.
- Revise na proporção do risco e do diff real. Pare quando os achados relevantes estiverem resolvidos ou decididos e os checks afetados passarem.
