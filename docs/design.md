# Design e acessibilidade

## Direção

- **Público:** donos, gerentes e operadores de balcão de pequenos comércios. A interface fica em português do Brasil.
- **Dispositivos:** PC de balcão com teclado, mouse e leitor USB, e celulares/tablets por toque, como PWA.
- **Tom:** sóbrio e legível, com foco em velocidade de operação. Sem decoração que atrase o balcão.
- **Tipografia:** fonte base de 16 px (`1rem`), aplicada no `body` em `src/app/globals.css` (decisão de 2026-10-28). Em `rem`, ela acompanha o zoom e a fonte padrão do navegador.
- **Requisitos de balcão** (direção, ainda sem telas): nas telas de Vendas, Caixa e Entrada, os botões principais terão no mínimo 60 px de altura.
- **Estados de alerta:** o semáforo verde/amarelo/vermelho nunca depende só da cor. Ele leva texto ou ícone com rótulo.

## Sistema existente

- **Fonte da verdade dos tokens:** `src/app/globals.css` (shadcn `base-nova`, cor base `neutral`). Cores em OKLCH (`--background`, `--foreground`, `--primary`, `--muted`, `--muted-foreground`, `--card`, `--border`, `--ring`, `--destructive`, `chart-*`), raio base `--radius: 0.625rem` e variante `.dark`.
- **Configuração:** `components.json` (`style: base-nova`, `iconLibrary: lucide`, aliases `@/components`, `@/lib/utils`, `@/components/ui`).
- **Tipografia:** Geist (sans) e Geist Mono via `next/font`, auto-hospedadas no build, sem CDN em runtime. A sans alimenta `--font-sans`.
- **Componentes:** nenhum componente shadcn instalado ainda; a página inicial usa só HTML semântico e tokens. Adicione com `npx shadcn@latest add <componente>` quando um fluxo precisar.
- **Ícones:** `lucide-react`, sempre com `aria-hidden="true"` quando decorativos.

## Interação

Use HTML semântico, navegação por teclado, foco visível (`outline-ring/50` e `focus-visible`) e contraste adequado. Rotule controles e campos. Mostre erros de validação ao lado do campo. Operações assíncronas mostram progresso e resultado, e impedem envio duplicado (crítico no PDV). Respeite `prefers-reduced-motion`.

## Layout e revisão

- Mobile first. Breakpoints padrão do Tailwind; a página inicial usa uma coluna no celular e duas a partir de `sm` (640 px). Conteúdo limitado a `max-w-4xl` com margem lateral de 16–32 px.
- **Página inicial:** `<main>`, cabeçalho com `h1`, seção rotulada por `h2` e lista com `h3`. Revisada contra estes critérios; ainda sem auditoria automatizada de acessibilidade, que entra com o primeiro fluxo interativo (skill `web-design-guidelines` e teste E2E).
- **Ainda não existem:** estados vazio, de erro e de carregamento, porque não há telas de dados. Cada fluxo novo define os seus.

## Manutenção

Mudanças visuais e de interação atualizam primeiro os tokens e componentes, e depois esta orientação quando uma regra mudar. Consulte as skills `shadcn` e `web-design-guidelines` nas revisões de UI.
