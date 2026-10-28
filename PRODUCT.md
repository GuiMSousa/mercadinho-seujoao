# Mkt Control

Sistema de controle de vendas e estoque para pequeno comerciante.

## Problema e objetivo

Pequenos comércios e mercadinhos não têm uma solução prática, ágil e barata para gerir o balcão. Isso gera quatro perdas recorrentes:

1. **Perda por validade:** não há controle de estoque por lote e validade, nem baixa automática pela regra PVPS (Primeiro que Vence, Primeiro que Sai).
2. **Ruptura de estoque:** não há estoque mínimo configurável nem lista de reposição gerada automaticamente.
3. **Furos no fechamento de caixa:** não há rotina rigorosa de abertura com troco, sangrias, suprimentos com motivo e fechamento cego com aferição de quebra.
4. **Cegueira de lucratividade:** o comerciante acompanha o faturamento, mas não a margem real (faturamento menos CMV) nem o custo histórico de cada venda.

O objetivo é eliminar essas quatro perdas com uma ferramenta usada no próprio balcão, no PC da loja ou no celular.

## Público e perfis

| Perfil    | Quem                   | Acesso                                                                                                                                                                  |
| --------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN`   | Proprietário e gerente | Tudo: custos, margens, relatórios financeiros, conciliação e histórico de caixa, usuários, estoque por lote e importação de produtos                                    |
| `CASHIER` | Operador de balcão     | Operação diária: vendas no PDV, abertura de caixa, sangria, suprimento, fechamento cego e consulta rápida de produtos. Nunca vê custos, margens ou métricas financeiras |

Dispositivos: PC ou notebook de balcão e celulares/tablets (Android e iPhone) usando o sistema como PWA instalado.

## Fluxos da primeira versão

1. **Autenticação e caixa diário**
   - Login com permissões separadas por perfil.
   - Abertura obrigatória de caixa com fundo de troco antes de liberar o PDV.
   - Sangrias e suprimentos com justificativa obrigatória.
   - Fechamento cego para o operador: ele digita os valores da gaveta sem ver o esperado.
   - Fechamento analítico para o administrador: quebra (sobra ou falta) e histórico de conciliação.
2. **Frente de caixa (PDV) e recibos**
   - Leitura por código de barras: câmera do celular (com suporte a múltiplas lentes), leitor USB/pistola ou busca por nome.
   - Itens unitários ou pesáveis (por quilo), com arredondamento ao centavo por item.
   - Pagamento em dinheiro (com troco), Pix, débito e crédito, inclusive combinados.
   - Recibo térmico em bobina de 58 mm e 80 mm, e comprovante pré-formatado para WhatsApp.
   - Venda bloqueada no cliente e no servidor quando o caixa está fechado.
3. **Estoque e lotes (PVPS/FEFO)**
   - Entrada de mercadoria com lote e validade obrigatórios, ou indicação de item sem validade.
   - Baixa automática na venda seguindo PVPS.
   - Perdas, ajustes manuais, extrato de movimentações e importação em lote por planilha.
4. **Alertas, reposição e relatórios**
   - Painel com semáforo (verde, amarelo, vermelho) para validade e estoque crítico (igual ou abaixo do mínimo).
   - Relatório de reposição com quantidade sugerida e lista formatada para WhatsApp; alerta diário opcional por e-mail.
   - Painel financeiro por período (hoje, 7 dias, 30 dias, mês atual, datas livres): faturamento bruto, CMV gravado na venda, lucro bruto, margem (%), ticket médio, gráfico por forma de pagamento e ranking dos produtos mais lucrativos.
5. **PWA**
   - Instalação na tela inicial (standalone) em iOS, Android e desktop, com Service Worker para carregamento rápido.

## MVP

Ordem de entrega, uma funcionalidade por vez:

1. Autenticação com perfis `ADMIN` e `CASHIER` — **entregue em 2026-10-28** (ver abaixo).
2. Cadastro de produtos (unitários e pesáveis) e entrada de estoque com lote e validade.
3. Caixa diário: abertura, sangria, suprimento e fechamento cego/analítico.
4. PDV com baixa PVPS, pagamentos múltiplos e recibo.
5. Alertas de validade e estoque mínimo, e relatório de reposição.
6. Painel financeiro com CMV histórico.
7. PWA instalável e leitor por câmera.

## Fora do escopo

- Desconto manual no checkout (o PDV não terá esse campo).
- Dedução de despesas fixas (aluguel, energia, salários): o lucro é só a margem bruta, faturamento menos CMV.
- Emissão fiscal (NFC-e/SAT) e integração com TEF ou maquininha: não foram pedidas.
- Esta entrega de base técnica não implementa nenhum fluxo de negócio.

## Requisitos

- **Sigilo:** custos, CMV e margens nunca chegam ao perfil `CASHIER`, nem pela API.
- **Caixa único:** só um caixa aberto por vez no estabelecimento. Sem caixa ativo, o servidor recusa vendas.
- **PVPS:** a baixa de estoque é sempre pelo lote que vence primeiro.
- **Dinheiro:** o total da venda é exatamente a soma dos itens já arredondados ao centavo. O CMV é gravado no momento da venda.
- **Sessão e segurança:** sessão por cookie com JWT, cabeçalho anti-CSRF e limite de 10 tentativas de login a cada 15 minutos por IP.
- **CSP rigorosa:** scripts e estilos só do próprio servidor, sem CDNs externas.
- **API documentada:** especificação OpenAPI validada por testes de contrato automatizados.
- **Balcão:** nas telas de Vendas, Caixa e Entrada, botões principais com no mínimo 60 px de altura; operação por toque.
- **Tipografia:** fonte base de 16 px (`1rem`) em todo o sistema; nenhum texto de operação abaixo disso.
- **Importação de planilhas:** CSV e XLSX com as colunas obrigatórias `Código de Barras`, `Nome`, `Preço de Custo`, `Preço de Venda` e `Estoque`.
- **Idioma:** interface em português do Brasil.
- **Acessibilidade:** HTML semântico, navegação por teclado, foco visível e contraste adequado.
- **Qualidade:** a suíte automatizada (`npm test`, `npm run spec:check` e, quando existir, `test:e2e`) deve ficar 100% verde.

## Restrições e decisões técnicas

- **Stack desta base:** Next.js 16 (App Router, TypeScript estrito, Tailwind 4, Turbopack), Drizzle ORM com PostgreSQL 18 e driver `pg`, Zod, Pino, Vitest, shadcn/ui (Base UI) com Lucide e Prettier. Node.js 24 LTS e npm com `package-lock.json`.
- **Stack confirmada** (dono do produto, 2026-10-28): Next.js 16 + Drizzle ORM + PostgreSQL 18. Ela substitui a stack do sistema antigo (Express, Prisma, SQLite/PostgreSQL, HTML/JS sem build). As regras de negócio, segurança e usabilidade permanecem.
- **Banco:** PostgreSQL local em Docker Compose, com volume persistente.
- **Hospedagem:** o PC da loja roda o servidor. Clientes locais ou remotos dependem dele ligado.
- **Túnel e HTTPS:** Cloudflare Tunnels (`cloudflared`) publica o servidor com HTTPS, exigido pela câmera do celular e pela instalação do PWA. Pela rede local em HTTP o sistema funciona no PC, mas sem leitor por câmera no celular. O atalho do PWA precisa de um túnel nomeado com domínio fixo; um túnel rápido gera URL temporária.
- **E-mail:** Resend, pelo SDK oficial para Node.js/TypeScript, usado no alerta diário de reposição. A chave fica só no servidor (`RESEND_API_KEY`) e entra com essa funcionalidade.
- **Organização:** features em `src/domains`, integrações em `src/infrastructure`, contratos em `src/contracts`. Rotas finas, serviços independentes do Next.js e acesso a dados por repositories. Detalhes em [docs/architecture.md](docs/architecture.md).

## Premissas e decisões pendentes

| Item                               | Tipo                | Impacto e próximo passo                                                                                                                                                                                                          |
| ---------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Item                               | Tipo                | Impacto e próximo passo                                                                                                                                                                                                          |
| ---                                | ---                 | ---                                                                                                                                                                                                                              |
| Migração de dados do sistema atual | Pendente (externa)  | Definir se cadastros e histórico existentes serão importados. A importação por planilha cobre produtos e estoque inicial                                                                                                         |
| CSP "sem scripts inline"           | Premissa reversível | O Next.js injeta scripts de inicialização; a proposta é CSP com nonce por requisição, que mantém só scripts do próprio servidor. Validar na tarefa de segurança                                                                  |
| Valores monetários                 | Premissa reversível | Centavos inteiros; peso em gramas; total do item arredondado ao centavo; total da venda é a soma dos itens                                                                                                                       |
| Loja única                         | Premissa reversível | Um estabelecimento por instalação, sem multiempresa                                                                                                                                                                              |
| Comprovante por WhatsApp           | Premissa reversível | Link `wa.me` com texto pré-formatado, sem API paga do WhatsApp                                                                                                                                                                   |
| Conta Resend e domínio remetente   | Pendente (externa)  | Criar a conta, verificar o domínio remetente e gerar `RESEND_API_KEY` antes do alerta diário                                                                                                                                     |
| Domínio fixo do Cloudflare Tunnel  | Pendente (externa)  | Domínio na conta Cloudflare para o túnel nomeado, para o atalho do PWA não perder o acesso                                                                                                                                       |
| Lote e validade na importação      | Pendente            | As colunas obrigatórias não trazem lote nem validade, mas toda entrada de estoque exige lote e validade (ou "sem validade"). Definir se a importação cria um lote "sem validade" ou aceita colunas opcionais `Lote` e `Validade` |
| Formato dos valores na planilha    | Premissa reversível | Preços em reais com vírgula ou ponto decimal; `Estoque` em unidades (em quilos para pesáveis); cabeçalhos exatamente como definidos, sem diferenciar maiúsculas                                                                  |

## Critérios de aceite

**Produto (por fluxo, a validar quando cada um for implementado):**

- Um `CASHIER` não consegue obter custo, CMV ou margem por nenhuma tela ou rota da API.
- Sem caixa aberto, o servidor recusa a venda mesmo que o cliente envie a requisição.
- Uma venda com dois lotes do mesmo produto baixa primeiro o de validade mais próxima.
- O total de uma venda com itens pesáveis é igual à soma dos itens arredondados ao centavo.
- O fechamento cego não mostra o valor esperado ao operador; o administrador vê a quebra.
- A 11ª tentativa de login de um mesmo IP em 15 minutos é bloqueada.
- Produtos com estoque igual ou abaixo do mínimo aparecem em vermelho no painel e na lista de reposição.

**Base técnica:** `npm run check` verde, PostgreSQL local saudável e conectado, imagem Docker de produção construída e respondendo. Evidências em [docs/setup.md](docs/setup.md).

## Entregue: autenticação

- Tabela `users` (papéis `ADMIN`/`CASHIER`, senha com hash scrypt) na primeira migration.
- Login por cookie JWT HTTP-only (12 h) com token anti-CSRF exigido em toda requisição autenticada que altera estado, e recusa de requisições de outra origem.
- Proxy e cada rota aplicam a mesma regra. Qualquer caminho fora de `/`, `/login` e do login exige sessão, e `/admin` e `/api/admin` são exclusivos de `ADMIN`.
- Limite de 10 logins por IP a cada 15 minutos; a 11ª tentativa recebe 429 com `Retry-After`.
- Contrato OpenAPI em `src/contracts/openapi.json`, verificado por `npm run spec:check`.
- Primeiro usuário criado por `npm run user:create -- <usuario> ADMIN`, com senha aleatória exibida uma vez. A troca de senha e a gestão de usuários pela tela ficam para a gestão de usuários.

**Critério verificado:**

- Um `CASHIER` autenticado recebe 403 em `/api/admin/users` e `/admin`.
- O 11º login do mesmo IP recebe 429.

Comprovado por testes automatizados e contra o servidor real (ver docs/setup.md).

## Próxima entrega

**Cadastro de produtos e entrada de estoque com lote e validade** (MVP item 2):

- produtos unitários e pesáveis, com custo visível só para `ADMIN`;
- entrada de estoque com lote e validade obrigatórios, ou "sem validade".

Critério: um `CASHIER` consulta produtos sem receber o preço de custo, e uma entrada sem lote ou validade é recusada pelo servidor.

**Endurecimento pendente:** CSP com nonce (scripts só do próprio servidor), numa tarefa própria de segurança.

## Manutenção

Atualize este documento quando objetivo, escopo, restrições ou critérios de aceite mudarem. Decisões técnicas detalhadas e evidências ficam em `docs/architecture.md` e `docs/setup.md`.
