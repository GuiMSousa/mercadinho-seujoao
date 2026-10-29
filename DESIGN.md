# DESIGN.md — Mkt Control

Contrato visual do Mkt Control e **fonte da verdade dos tokens**. `design-system/tokens.css` implementa as tabelas da seção [Tokens](#tokens), e `design-system/tokens.test.ts` (roda no `npm test`) falha quando um token existe ou tem valor diferente em só um dos dois. Para mudar um token, altere esta tabela e o CSS no mesmo commit.

## Direção

- **Público:** donos, gerentes e operadores de balcão de pequenos comércios. Interface em português do Brasil.
- **Dispositivos:** PC de balcão com teclado, mouse e leitor USB, e celulares/tablets por toque, como PWA.
- **Tom:** dashboard claro e calmo. Cartões brancos sobre um fundo cinza-frio, tinta quase preta e um único azul saturado. Informação densa, sem decoração: nada de imagens, texturas ou gradientes no app.
- **Fonte base de 16 px** (`1rem`, decisão de 2026-10-28), aplicada no `body` em `src/app/globals.css`. Tamanhos em `rem` acompanham o zoom e a fonte padrão do navegador.
- **Balcão** (Vendas, Caixa, Entrada): botões principais com no mínimo 60 px de altura (`size="counter"`), teclas do teclado numérico com 72 px, texto de 22 px (`text-counter`) e total do PDV com 56 px (`text-counter-total`). O uso é primeiro por toque.
- **Semáforo** verde/laranja/vermelho nunca depende só da cor. Ele sempre leva texto ou ícone com rótulo.

## Conteúdo

- **Linguagem:** português operacional, com o vocabulário do comerciante: _caixa, troco, sangria, suprimento, fechamento, lote, validade, reposição, PDV, CMV, margem_.
- **Voz:** direta e calma, imperativa nas ações. Sem exclamação, piada ou emoji. Trate o usuário por _você_ implícito ("Abra o caixa para começar a vender."), nunca por "nós".
- **Caixa:** só a primeira letra maiúscula em títulos, botões, abas e cabeçalhos ("Lotes a vencer"). `ADMIN` e `CASHIER` aparecem só no código; a interface diz _Administrador_ e _Operador de caixa_.
- **Botões** começam com verbo e são específicos: _Abrir caixa, Registrar sangria, Finalizar venda, Importar produtos_. Evite "OK" e "Enviar".
- **Erros** dizem o que houve e o que fazer: "Nenhum caixa aberto. Abra o caixa para registrar vendas."
- **Estados vazios** indicam a próxima ação: "Bipe ou toque em um produto para adicionar."
- **Números:** `R$ 1.234,56`, `28/10/2026`, `14:05`. Valores negativos usam o menos verdadeiro (`−`). Unidades em minúsculas após o número: `24 un`, `1,5 kg`.
- **Perfil `CASHIER`:** nunca vê custo, CMV, margem ou caixa esperado. Omita esses elementos da interface; não os borre nem os oculte. `Money hidden` serve só para mascarar um valor numa tela compartilhada.

## Fundamentos visuais

- **Cor:** o azul (`brand`) marca a ação-chave da tela (uma por tela), entradas de dinheiro e destaques de gráfico. O vermelho indica saída, quebra, vencido e ação destrutiva; o laranja, a vencer ou abaixo do mínimo; o verde, sucesso e margem. A tinta (`primary`) é a cor do botão principal. Status usam fundo claro com texto escuro do mesmo tom (`*-bg` + `*-fg`).
- **Tipografia:** uma só família, Hanken Grotesk (OFL, variável 400–700). Ela substitui a Neue Montreal da referência, que é comercial. Use peso 500 em títulos e números, 400 no texto e 600 só no total do PDV e em contagens-chave. Tamanhos grandes levam tracking negativo (`tracking-tight`, `tracking-display`). Números são sempre `tabular-nums`.
- **Escala no app:** a referência usa 14 px como padrão; aqui, pela decisão dos 16 px:
  - texto corrido, campos, rótulos e botões `md` ou maiores usam `text-body-lg` (16 px);
  - dicas, erros e células de tabela usam `text-body-md` (14 px);
  - metadados, como badges e cabeçalhos de tabela, usam `text-body-sm` (13 px) ou `text-caption` (12 px).
- **Dinheiro:** use sempre `Money` (centavos inteiros). O `R$` é menor e cinza, e os centavos ficam esmaecidos.
- **Cartões:** fundo `surface-card`, `rounded-card` (16 px), borda `border-soft` de 1 px, `shadow-(--shadow-sm)` e padding de 20 px (`p-5`).
- **Raios:**

  | Raio           | Uso                           |
  | -------------- | ----------------------------- |
  | `xs` (6)       | checkbox                      |
  | `sm` (8)       | controles pequenos            |
  | `control` (10) | botões e campos padrão        |
  | `lg` (12)      | controles grandes e de balcão |
  | `card` (16)    | cartões                       |
  | `dialog` (20)  | diálogos                      |
  | `full`         | badges                        |

- **Bordas:** 1 px. Linhas de tabela em `border-soft`. Não use filetes coloridos na lateral.
- **Hover:** o fundo sobe um passo (branco → `surface-hover`, tinta → `primary-hover`, azul 500 → 600). Nunca use opacidade.
- **Pressionar:** escala 0,98 (botão), 0,96 (botão de ícone) ou 0,97 (tecla), em `--dur-fast`.
- **Foco (teclado):**
  - regra global em `globals.css`: contorno de 2 px na cor `focus`, com 2 px de folga, só em `:focus-visible`. Por ser `outline`, sobrevive ao modo de alto contraste do Windows;
  - campos: borda `focus` mais halo de 3 px (`ring-3 ring-focus-halo`), que vira `focus-halo-danger` quando há erro.
- **Movimento:** 120–280 ms com `ease-out`, só fades e escala, sem quique. `prefers-reduced-motion` zera animações e transições globalmente.
- **Transparência:** só no fundo do diálogo (`bg-overlay` com `backdrop-blur-xs`).
- **Layout:** mobile first, com os breakpoints padrão do Tailwind. A referência define o shell que ainda será construído: sidebar de 248 px, topbar de 64 px, padding de 24 px e, abaixo de 900 px, barra inferior flutuante. Os tokens de layout entram aqui junto com esse shell.

## Temas

- **Claro** é o padrão. **Escuro** se aplica com `data-theme="dark"` em `<html>`, ou numa subárvore. A variante `dark:` do Tailwind está ligada a esse atributo.
- Só os aliases semânticos mudam entre temas; as rampas são iguais nos dois.
- Componentes usam apenas tokens semânticos, nunca rampas.
  - Texto sobre azul ou vermelho sólido: `text-on-color`.
  - Texto sobre `bg-primary`: `text-primary-foreground`.
  - No escuro, o botão `primary` inverte para branco com texto escuro, e o `brand` continua azul.
- **Hoje** o app fica sempre no claro, e a vitrine `/design-system` alterna os dois temas.
- **Seletor de tema:** fica para quando existir a topbar. A referência pede para seguir `prefers-color-scheme` no primeiro acesso, depois persistir a escolha, com os rótulos "Modo escuro" / "Modo claro".

## Ícones e marca

- **Biblioteca:** `lucide-react`, já instalada, no lugar do HugeIcons da referência, para não manter duas bibliotecas. Siga o mesmo estilo: traço e `currentColor`.
- **Tamanhos:** 16 px em tabelas e tags, 18–20 px em botões e navegação, 24 px no balcão.
- **Acessibilidade:** ícone decorativo leva `aria-hidden="true"`. Botão só com ícone usa `IconButton`, cujo `label` é obrigatório.
- **Sem emoji** e sem pictogramas Unicode como ícone.
- **Sem logo:** o nome "Mkt Control" aparece em texto (peso 600, `tracking-display`). Não desenhe um logo.

## Interação e acessibilidade

- Use HTML semântico, navegação por teclado, foco visível e contraste adequado.
- Rotule todo controle. O erro aparece ao lado do campo (`Input`/`Select` com `error` aplicam `aria-invalid` e `aria-describedby`).
- Operações assíncronas mostram progresso e resultado e impedem envio duplicado, o que é crítico no PDV. Use `Button loading`, que aplica `aria-busy` e bloqueia cliques sem perder o foco.
- Tabelas têm `caption` (oculto visualmente) e região rolável focável.
- O estado de seleção vem do controle (`Checkbox`); a linha só destaca.
- Cada fluxo novo define seus estados vazio, de erro e de carregamento.
- Revise com a skill `web-design-guidelines` antes de concluir mudanças de UI.

## Biblioteca `design-system/`

```text
design-system/
├── tokens.css          # implementação dos tokens; importada por src/app/globals.css
├── tokens.test.ts      # contrato DESIGN.md ↔ tokens.css
├── fonts.ts            # Hanken Grotesk via next/font/local (variável --font-hanken)
├── assets/fonts/       # woff2: latin no app; latin-ext só para as referências
├── lib/                # cn ciente das escalas, formatação de centavos, lógica do teclado
├── components/         # componentes React (padrão shadcn base-nova sobre Base UI)
└── references/         # exportação original do Claude Design; estática, não importar
```

Importe pelo alias `@ds/*`, por exemplo `import { Button } from "@ds/components/button"`. A vitrine fica em `/design-system`: é pública, usa só dados fictícios e mostra os componentes, seus estados e os dois temas.

| Componente   | Arquivo        | API principal                                                                                                        | Estados cobertos                                      |
| ------------ | -------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `Button`     | `button.tsx`   | `variant` primary · brand · secondary · soft · ghost · danger; `size` sm · md · lg · counter; `fullWidth`; `loading` | hover, pressionado, foco, desabilitado, carregando    |
| `IconButton` | `button.tsx`   | `icon` (Lucide), `label` obrigatório; `variant` secondary · ghost · primary · brand · danger; `size`                 | hover, pressionado, foco, desabilitado                |
| `Input`      | `input.tsx`    | `label`, `hint`, `error`, `prefix`, `suffix`, `size`, `numeric`                                                      | foco (halo), erro, desabilitado                       |
| `Select`     | `select.tsx`   | nativo; `label`, `hint`, `error`, `options`, `placeholder`, `size`                                                   | foco, erro, desabilitado                              |
| `Checkbox`   | `checkbox.tsx` | Base UI; `label`, `checked`/`defaultChecked`, `indeterminate`, `onCheckedChange`                                     | marcado, indeterminado, foco, desabilitado, inválido  |
| `Badge`      | `badge.tsx`    | `tone` success · danger · warning · info · neutral; `dot`; `size` sm · md                                            | —                                                     |
| `Money`      | `money.tsx`    | `cents` inteiro; `size` sm · md · lg · xl · display · counter; `tone` in · out · margin; `signed`; `hidden`          | oculto                                                |
| `Card`       | `card.tsx`     | `title`, `subtitle`, `actions`, `titleAs` h2 · h3, `as`, `flush`                                                     | —                                                     |
| `Table`      | `table.tsx`    | `caption` obrigatório, `columns` com `render`, `rows`, `rowKey`, `empty`, `dense`, `isSelected`                      | hover, seleção, vazio                                 |
| `Dialog`     | `dialog.tsx`   | Base UI; `open`, `onOpenChange`, `title`, `description`, `footer`                                                    | abertura/fechamento, foco preso, Esc, retorno do foco |
| `Keypad`     | `keypad.tsx`   | `value` (centavos em dígitos), `onChange`, `maxLength`, `label`; converta com `keypadCents()`                        | pressionado, foco                                     |
| `Label`      | `label.tsx`    | rótulo de formulário                                                                                                 | desabilitado                                          |
| `Field`      | `field.tsx`    | interno: rótulo, controle e dica/erro compartilhados por `Input` e `Select`                                          | —                                                     |

### Como usar

- Use as classes da tabela [Utilitários de cor](#utilitários-de-cor) e as escalas abaixo. Rampas, hex, `rgb()`, `px` e valores arbitrários (`text-[…]`, `p-[…]`, `rounded-[…]`, `bg-[…]`) não passam no ESLint (`no-restricted-syntax` em `eslint.config.mjs`). As paletas e escalas padrão do Tailwind foram removidas, então uma classe fora do sistema simplesmente não gera CSS.
- `cn` vem de `@ds/lib/cn`. O pacote `cn` puro trataria `text-body-lg` como cor e o descartaria; por isso o ESLint bloqueia `import … from "cn"`.
- Sombras: `shadow-(--shadow-sm)`, porque mudam no tema escuro.
- Espaçamento: escala padrão do Tailwind (passo de 0,25rem), restrita aos passos do sistema: 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12 e 16 (2 a 64 px). Alturas de controle usam `h-control-sm|md|lg|counter|counter-lg` e `size-control-*`.
- Transições usam a duração e a curva padrão (`--dur-base`, `ease-out`); `duration-(--dur-fast)` fica para resposta de toque.

### Como criar um componente

1. **Escolha a base.** Procure primeiro um equivalente no shadcn com `npx shadcn@latest add <nome>`; o `components.json` já aponta `ui` para `@ds/components` e `utils` para `@ds/lib/cn`. Sem equivalente, use Base UI (`@base-ui/react`) ou HTML nativo. Não adicione outra biblioteca de UI.
2. **Leia a especificação** em `design-system/references/components/<grupo>/<Nome>.jsx` e `.d.ts`, e veja o `*.card.html` do grupo.
3. **Troque o código gerado pelo shadcn para os tokens:**
   - tamanhos de texto: `text-xs` → `text-caption`, `text-sm` → `text-body-md`, `text-base` → `text-body-lg`, `text-lg` → `text-h3`;
   - raio: `rounded-md` → `rounded-control`;
   - foco: `focus-visible:ring-[3px] ring-ring/50` → foco global ou `ring-3 ring-focus-halo`;
   - import: `import { cn } from "@ds/lib/cn"`.
4. **Cubra os estados:** hover, foco, desabilitado (`data-disabled`/`disabled`), erro (`aria-invalid`), carregando e seleção (`data-checked`/`data-selected`).
5. **Lógica não trivial** vai para `design-system/lib/` com teste. Ponha um exemplo na vitrine `/design-system` e uma linha na tabela de componentes acima.
6. **Token novo:** linha na seção [Tokens](#tokens) e declaração em `tokens.css`. O teste exige os dois.

### Referências

`design-system/references/` guarda a exportação do Claude Design de 2026-10-28 como especificação visual:

- `guidelines/*.html`: cor, tipografia, espaçamento, raios, sombras, foco, ícones e componentes no escuro;
- `components/**/*.card.html`, com o código-fonte `.jsx` e `.d.ts` de cada componente;
- `ui_kits/mkt-control/index.html`: protótipo clicável de Login, Painel, Vendas, Caixa e Estoque, com dados fictícios;
- `thumbnail.html`;
- `tokens/`: valores originais, em px.

Para abrir, sirva a pasta `design-system` por HTTP, por exemplo `python -m http.server 8765 --directory design-system`, e acesse `http://127.0.0.1:8765/references/ui_kits/mkt-control/index.html`. As páginas precisam de internet, porque React 18 e Babel vêm do unpkg.

A pasta não é código do app: ESLint, Prettier, TypeScript e Tailwind a ignoram, e importar de lá é erro de lint.

**Ainda não portados** (especificação só nas referências): `StatCard`, `Tag`, `Radio`, `Switch`, `Tabs`, `SidebarNav`, `BottomNav`, `Toast`, `Tooltip` e `Icon` (HugeIcons). Os tokens deles (gráficos, barra inferior, switch, contadores, texto inverso secundário e layout) entram aqui quando o componente for portado.

## Tokens

No app, raios, tipografia e alturas de controle usam `rem`: o valor em px da referência dividido por 16. Bordas e sombras continuam em px.

### Rampas

Base fixa dos dois temas. Só os aliases semânticos as referenciam.

| Token           | Valor     |
| --------------- | --------- |
| `--blue-50`     | `#ebf1ff` |
| `--blue-100`    | `#d5e2ff` |
| `--blue-200`    | `#c0d5ff` |
| `--blue-400`    | `#6895ff` |
| `--blue-500`    | `#335bff` |
| `--blue-600`    | `#2547d0` |
| `--blue-700`    | `#1f3bad` |
| `--red-50`      | `#ffebec` |
| `--red-100`     | `#ffd5d8` |
| `--red-500`     | `#fb3748` |
| `--red-600`     | `#e93544` |
| `--red-700`     | `#c0293b` |
| `--orange-50`   | `#fff1eb` |
| `--orange-500`  | `#fa7319` |
| `--orange-700`  | `#b64f0a` |
| `--green-50`    | `#e0faec` |
| `--green-500`   | `#1fc16b` |
| `--green-700`   | `#178c4e` |
| `--neutral-0`   | `#ffffff` |
| `--neutral-50`  | `#f5f7fa` |
| `--neutral-100` | `#f2f5f8` |
| `--neutral-200` | `#e1e4ea` |
| `--neutral-300` | `#cacfd8` |
| `--neutral-400` | `#99a0ae` |
| `--neutral-500` | `#717784` |
| `--neutral-600` | `#525866` |
| `--neutral-700` | `#2b303b` |
| `--neutral-800` | `#222530` |
| `--neutral-900` | `#181b25` |
| `--neutral-950` | `#0e121b` |

### Semânticos

"—" no escuro significa que o token mantém o valor do claro.

**Superfícies e texto**

| Token               | Claro                    | Escuro                |
| ------------------- | ------------------------ | --------------------- |
| `--bg-app`          | `var(--neutral-50)`      | `#0a0d14`             |
| `--surface-card`    | `var(--neutral-0)`       | `var(--neutral-900)`  |
| `--surface-sunken`  | `var(--neutral-100)`     | `#1f232d`             |
| `--surface-hover`   | `var(--neutral-50)`      | `var(--neutral-800)`  |
| `--surface-overlay` | `rgba(14, 18, 27, 0.48)` | `rgba(0, 0, 0, 0.64)` |
| `--text-strong`     | `var(--neutral-950)`     | `#f5f7fa`             |
| `--text-body`       | `var(--neutral-700)`     | `var(--neutral-300)`  |
| `--text-sub`        | `var(--neutral-500)`     | `var(--neutral-400)`  |
| `--text-soft`       | `var(--neutral-400)`     | `var(--neutral-500)`  |
| `--text-disabled`   | `var(--neutral-300)`     | `var(--neutral-600)`  |
| `--text-inverse`    | `var(--neutral-0)`       | `var(--neutral-950)`  |
| `--text-link`       | `var(--blue-500)`        | `var(--blue-400)`     |
| `--text-on-color`   | `var(--neutral-0)`       | —                     |

**Bordas e ações**

| Token                    | Claro                | Escuro               |
| ------------------------ | -------------------- | -------------------- |
| `--border-soft`          | `var(--neutral-100)` | `#22262f`            |
| `--border-default`       | `var(--neutral-200)` | `var(--neutral-700)` |
| `--border-strong`        | `var(--neutral-300)` | `var(--neutral-600)` |
| `--border-focus`         | `var(--blue-500)`    | `var(--blue-400)`    |
| `--action-primary`       | `var(--neutral-950)` | `var(--neutral-0)`   |
| `--action-primary-hover` | `var(--neutral-800)` | `var(--neutral-200)` |
| `--action-brand`         | `var(--blue-500)`    | —                    |
| `--action-brand-hover`   | `var(--blue-600)`    | `var(--blue-400)`    |
| `--action-danger`        | `var(--red-500)`     | —                    |
| `--action-danger-hover`  | `var(--red-600)`     | —                    |

**Status**

| Token             | Claro                | Escuro                     |
| ----------------- | -------------------- | -------------------------- |
| `--success-fg`    | `var(--green-700)`   | `#5ee09a`                  |
| `--success-bg`    | `var(--green-50)`    | `rgba(31, 193, 107, 0.16)` |
| `--success-solid` | `var(--green-500)`   | —                          |
| `--danger-fg`     | `var(--red-700)`     | `#ff8a94`                  |
| `--danger-bg`     | `var(--red-50)`      | `rgba(251, 55, 72, 0.16)`  |
| `--danger-solid`  | `var(--red-500)`     | —                          |
| `--warning-fg`    | `var(--orange-700)`  | `#ffb27a`                  |
| `--warning-bg`    | `var(--orange-50)`   | `rgba(250, 115, 25, 0.16)` |
| `--warning-solid` | `var(--orange-500)`  | —                          |
| `--info-fg`       | `var(--blue-700)`    | `#9db8ff`                  |
| `--info-bg`       | `var(--blue-50)`     | `rgba(51, 91, 255, 0.2)`   |
| `--info-solid`    | `var(--blue-500)`    | —                          |
| `--neutral-fg`    | `var(--neutral-600)` | `var(--neutral-300)`       |
| `--neutral-bg`    | `var(--neutral-100)` | `var(--neutral-700)`       |
| `--neutral-solid` | `var(--neutral-400)` | —                          |

**Controles, seleção e foco**

| Token                  | Claro                | Escuro                      |
| ---------------------- | -------------------- | --------------------------- |
| `--control-soft`       | `var(--neutral-200)` | `var(--neutral-700)`        |
| `--control-soft-hover` | `var(--neutral-300)` | `var(--neutral-600)`        |
| `--control-pressed`    | `var(--neutral-100)` | `var(--neutral-700)`        |
| `--selected-bg`        | `var(--blue-50)`     | `rgba(51, 91, 255, 0.18)`   |
| `--selected-fg`        | `var(--blue-700)`    | `#9db8ff`                   |
| `--selected-border`    | `var(--blue-200)`    | `rgba(104, 149, 255, 0.45)` |
| `--focus-halo`         | `var(--blue-100)`    | `rgba(51, 91, 255, 0.35)`   |
| `--focus-halo-danger`  | `var(--red-100)`     | `rgba(251, 55, 72, 0.35)`   |
| `--danger-soft-hover`  | `var(--red-100)`     | `rgba(251, 55, 72, 0.26)`   |

**Domínio** (dinheiro e validade)

| Token              | Claro               | Escuro            |
| ------------------ | ------------------- | ----------------- |
| `--money-in`       | `var(--blue-500)`   | `var(--blue-400)` |
| `--money-out`      | `var(--red-500)`    | `#ff6b78`         |
| `--money-margin`   | `var(--green-500)`  | —                 |
| `--expiry-ok`      | `var(--green-500)`  | —                 |
| `--expiry-soon`    | `var(--orange-500)` | —                 |
| `--expiry-expired` | `var(--red-500)`    | —                 |

**Elevação e movimento**

| Token                | Claro                                                                        | Escuro                                                                |
| -------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `--shadow-xs`        | `0 1px 2px rgba(10, 13, 20, 0.03)`                                           | `0 1px 2px rgba(0, 0, 0, 0.3)`                                        |
| `--shadow-sm`        | `0 1px 2px rgba(10, 13, 20, 0.04), 0 1px 3px rgba(10, 13, 20, 0.04)`         | `0 1px 2px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.25)`        |
| `--shadow-md`        | `0 4px 12px -2px rgba(14, 18, 27, 0.06), 0 2px 4px rgba(14, 18, 27, 0.03)`   | `0 4px 12px -2px rgba(0, 0, 0, 0.45)`                                 |
| `--shadow-lg`        | `0 16px 32px -12px rgba(14, 18, 27, 0.14)`                                   | `0 16px 32px -12px rgba(0, 0, 0, 0.6)`                                |
| `--shadow-xl`        | `0 24px 48px -16px rgba(14, 18, 27, 0.22)`                                   | `0 24px 48px -16px rgba(0, 0, 0, 0.7)`                                |
| `--shadow-btn-dark`  | `inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 1px 2px rgba(14, 18, 27, 0.24)`  | `inset 0 -1px 0 rgba(14, 18, 27, 0.12), 0 1px 2px rgba(0, 0, 0, 0.4)` |
| `--shadow-btn-brand` | `inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 1px 2px rgba(37, 71, 208, 0.32)` | —                                                                     |
| `--dur-fast`         | `120ms`                                                                      | —                                                                     |
| `--dur-base`         | `180ms`                                                                      | —                                                                     |
| `--dur-slow`         | `280ms`                                                                      | —                                                                     |

### Utilitários de cor

`--color-*: initial` remove a paleta padrão do Tailwind. Cada token abaixo gera `bg-*`, `text-*`, `border-*`, `ring-*` e as demais utilidades de cor. Os nomes do shadcn continuam existindo para que componentes adicionados pelo CLI já saiam no sistema.

| Token                          | Valor                         | Uso                                                    |
| ------------------------------ | ----------------------------- | ------------------------------------------------------ |
| `--color-background`           | `var(--bg-app)`               | shadcn: fundo da página                                |
| `--color-foreground`           | `var(--text-strong)`          | shadcn: texto de destaque                              |
| `--color-card`                 | `var(--surface-card)`         | shadcn: cartão                                         |
| `--color-card-foreground`      | `var(--text-body)`            | shadcn: texto do cartão                                |
| `--color-popover`              | `var(--surface-card)`         | shadcn: popover                                        |
| `--color-popover-foreground`   | `var(--text-body)`            | shadcn: texto do popover                               |
| `--color-primary`              | `var(--action-primary)`       | botão principal (tinta)                                |
| `--color-primary-foreground`   | `var(--text-inverse)`         | texto sobre `bg-primary`                               |
| `--color-secondary`            | `var(--control-soft)`         | shadcn: botão secundário                               |
| `--color-secondary-foreground` | `var(--text-strong)`          | shadcn: texto do secundário                            |
| `--color-muted`                | `var(--surface-sunken)`       | shadcn: fundo rebaixado                                |
| `--color-muted-foreground`     | `var(--text-sub)`             | shadcn: texto secundário                               |
| `--color-accent`               | `var(--surface-hover)`        | shadcn: hover de item                                  |
| `--color-accent-foreground`    | `var(--text-strong)`          | shadcn: texto em hover                                 |
| `--color-destructive`          | `var(--action-danger)`        | ação destrutiva                                        |
| `--color-border`               | `var(--border-default)`       | borda padrão (aplicada a `*` em `globals.css`)         |
| `--color-input`                | `var(--border-default)`       | shadcn: borda de campo                                 |
| `--color-ring`                 | `var(--border-focus)`         | shadcn: anel de foco                                   |
| `--color-app`                  | `var(--bg-app)`               | `bg-app`: fundo da página                              |
| `--color-surface-card`         | `var(--surface-card)`         | `bg-surface-card`                                      |
| `--color-surface-sunken`       | `var(--surface-sunken)`       | `bg-surface-sunken`: cabeçalho de tabela, desabilitado |
| `--color-surface-hover`        | `var(--surface-hover)`        | `hover:bg-surface-hover`                               |
| `--color-overlay`              | `var(--surface-overlay)`      | `bg-overlay`: fundo do diálogo                         |
| `--color-strong`               | `var(--text-strong)`          | `text-strong`: títulos e valores                       |
| `--color-body`                 | `var(--text-body)`            | `text-body`: texto corrido (padrão do `body`)          |
| `--color-sub`                  | `var(--text-sub)`             | `text-sub`: texto secundário                           |
| `--color-soft`                 | `var(--text-soft)`            | `text-soft`: placeholder, centavos                     |
| `--color-disabled`             | `var(--text-disabled)`        | `text-disabled`                                        |
| `--color-inverse`              | `var(--text-inverse)`         | `text-inverse`                                         |
| `--color-link`                 | `var(--text-link)`            | `text-link`                                            |
| `--color-on-color`             | `var(--text-on-color)`        | `text-on-color`: texto sobre azul/vermelho sólido      |
| `--color-border-soft`          | `var(--border-soft)`          | `border-border-soft`: cartões e linhas de tabela       |
| `--color-border-strong`        | `var(--border-strong)`        | `border-border-strong`                                 |
| `--color-focus`                | `var(--border-focus)`         | `outline-focus`, `border-focus`                        |
| `--color-primary-hover`        | `var(--action-primary-hover)` | `hover:bg-primary-hover`                               |
| `--color-brand`                | `var(--action-brand)`         | `bg-brand`: ação-chave                                 |
| `--color-brand-hover`          | `var(--action-brand-hover)`   | `hover:bg-brand-hover`                                 |
| `--color-destructive-hover`    | `var(--action-danger-hover)`  | `hover:bg-destructive-hover`                           |
| `--color-success-fg`           | `var(--success-fg)`           | status: texto                                          |
| `--color-success-bg`           | `var(--success-bg)`           | status: fundo                                          |
| `--color-success-solid`        | `var(--success-solid)`        | status: ponto e preenchimento                          |
| `--color-danger-fg`            | `var(--danger-fg)`            | erro: texto                                            |
| `--color-danger-bg`            | `var(--danger-bg)`            | erro: fundo                                            |
| `--color-danger-solid`         | `var(--danger-solid)`         | erro: borda de campo, ponto                            |
| `--color-warning-fg`           | `var(--warning-fg)`           | alerta: texto                                          |
| `--color-warning-bg`           | `var(--warning-bg)`           | alerta: fundo                                          |
| `--color-warning-solid`        | `var(--warning-solid)`        | alerta: ponto                                          |
| `--color-info-fg`              | `var(--info-fg)`              | informação: texto                                      |
| `--color-info-bg`              | `var(--info-bg)`              | informação: fundo                                      |
| `--color-info-solid`           | `var(--info-solid)`           | informação: ponto                                      |
| `--color-neutral-fg`           | `var(--neutral-fg)`           | neutro: texto                                          |
| `--color-neutral-bg`           | `var(--neutral-bg)`           | neutro: fundo                                          |
| `--color-neutral-solid`        | `var(--neutral-solid)`        | neutro: ponto                                          |
| `--color-control-soft`         | `var(--control-soft)`         | botão `soft`                                           |
| `--color-control-soft-hover`   | `var(--control-soft-hover)`   | hover do `soft`                                        |
| `--color-control-pressed`      | `var(--control-pressed)`      | tecla pressionada                                      |
| `--color-selected-bg`          | `var(--selected-bg)`          | linha ou item selecionado                              |
| `--color-selected-fg`          | `var(--selected-fg)`          | texto selecionado                                      |
| `--color-selected-border`      | `var(--selected-border)`      | borda selecionada                                      |
| `--color-focus-halo`           | `var(--focus-halo)`           | `ring-focus-halo`: halo de campo                       |
| `--color-focus-halo-danger`    | `var(--focus-halo-danger)`    | halo de campo com erro                                 |
| `--color-danger-soft-hover`    | `var(--danger-soft-hover)`    | hover do `IconButton` danger                           |
| `--color-money-in`             | `var(--money-in)`             | entrada de dinheiro                                    |
| `--color-money-out`            | `var(--money-out)`            | saída de dinheiro                                      |
| `--color-money-margin`         | `var(--money-margin)`         | margem em gráficos                                     |
| `--color-expiry-ok`            | `var(--expiry-ok)`            | validade no prazo                                      |
| `--color-expiry-soon`          | `var(--expiry-soon)`          | a vencer                                               |
| `--color-expiry-expired`       | `var(--expiry-expired)`       | vencido                                                |

### Escalas

As escalas padrão do Tailwind de texto, peso, tracking, raio, sombra e easing foram removidas (`initial`); valem só estas. O espaçamento mantém o passo de `0.25rem`.

| Token                                  | Valor                                                      | Uso                                        |
| -------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `--font-sans`                          | `var(--font-hanken), ui-sans-serif, system-ui, sans-serif` | `font-sans` (padrão do `body`)             |
| `--text-display`                       | `2.5rem`                                                   | `text-display` (40/48)                     |
| `--text-display--line-height`          | `3rem`                                                     |                                            |
| `--text-h1`                            | `2rem`                                                     | `text-h1` (32/40)                          |
| `--text-h1--line-height`               | `2.5rem`                                                   |                                            |
| `--text-h2`                            | `1.5rem`                                                   | `text-h2` (24/32)                          |
| `--text-h2--line-height`               | `2rem`                                                     |                                            |
| `--text-h3`                            | `1.125rem`                                                 | `text-h3` (18/24)                          |
| `--text-h3--line-height`               | `1.5rem`                                                   |                                            |
| `--text-body-lg`                       | `1rem`                                                     | `text-body-lg` (16/24), base do app        |
| `--text-body-lg--line-height`          | `1.5rem`                                                   |                                            |
| `--text-body-md`                       | `0.875rem`                                                 | `text-body-md` (14/20)                     |
| `--text-body-md--line-height`          | `1.25rem`                                                  |                                            |
| `--text-body-sm`                       | `0.8125rem`                                                | `text-body-sm` (13/18)                     |
| `--text-body-sm--line-height`          | `1.125rem`                                                 |                                            |
| `--text-caption`                       | `0.75rem`                                                  | `text-caption` (12/16)                     |
| `--text-caption--line-height`          | `1rem`                                                     |                                            |
| `--text-counter`                       | `1.375rem`                                                 | `text-counter` (22/28), balcão             |
| `--text-counter--line-height`          | `1.75rem`                                                  |                                            |
| `--text-counter-total`                 | `3.5rem`                                                   | `text-counter-total` (56/60), total do PDV |
| `--text-counter-total--line-height`    | `3.75rem`                                                  |                                            |
| `--text-currency`                      | `0.62em`                                                   | `text-currency`: "R$" do `Money`           |
| `--font-weight-normal`                 | `400`                                                      | `font-normal`                              |
| `--font-weight-medium`                 | `500`                                                      | `font-medium`                              |
| `--font-weight-semibold`               | `600`                                                      | `font-semibold`                            |
| `--font-weight-bold`                   | `700`                                                      | `font-bold`                                |
| `--tracking-normal`                    | `0em`                                                      | `tracking-normal`                          |
| `--tracking-tight`                     | `-0.02em`                                                  | `tracking-tight`                           |
| `--tracking-display`                   | `-0.03em`                                                  | `tracking-display`                         |
| `--radius-xs`                          | `0.375rem`                                                 | `rounded-xs` (6)                           |
| `--radius-sm`                          | `0.5rem`                                                   | `rounded-sm` (8)                           |
| `--radius-md`                          | `0.625rem`                                                 | `rounded-md` (10)                          |
| `--radius-lg`                          | `0.75rem`                                                  | `rounded-lg` (12)                          |
| `--radius-xl`                          | `1rem`                                                     | `rounded-xl` (16)                          |
| `--radius-2xl`                         | `1.25rem`                                                  | `rounded-2xl` (20)                         |
| `--radius-3xl`                         | `1.5rem`                                                   | `rounded-3xl` (24)                         |
| `--radius-control`                     | `0.625rem`                                                 | `rounded-control`: botões e campos         |
| `--radius-card`                        | `1rem`                                                     | `rounded-card`                             |
| `--radius-dialog`                      | `1.25rem`                                                  | `rounded-dialog`                           |
| `--spacing-control-sm`                 | `2rem`                                                     | `h-control-sm` (32)                        |
| `--spacing-control-md`                 | `2.5rem`                                                   | `h-control-md` (40)                        |
| `--spacing-control-lg`                 | `3rem`                                                     | `h-control-lg` (48)                        |
| `--spacing-control-counter`            | `3.75rem`                                                  | `h-control-counter` (60), balcão           |
| `--spacing-control-counter-lg`         | `4.5rem`                                                   | `h-control-counter-lg` (72), teclas        |
| `--ease-out`                           | `cubic-bezier(0.2, 0.8, 0.2, 1)`                           | `ease-out`, padrão das transições          |
| `--ease-in-out`                        | `cubic-bezier(0.4, 0, 0.2, 1)`                             | `ease-in-out`                              |
| `--default-transition-duration`        | `var(--dur-base)`                                          | duração padrão de `transition-*`           |
| `--default-transition-timing-function` | `var(--ease-out)`                                          | curva padrão de `transition-*`             |

## Manutenção

Mudança visual ou de interação começa por este arquivo (regra ou token), segue para `design-system/` e termina com um exemplo na vitrine `/design-system`. Consulte as skills `shadcn` e `web-design-guidelines` nas revisões de UI.
