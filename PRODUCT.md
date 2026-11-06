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
2. Cadastro de produtos (unitários e pesáveis) e entrada de estoque com lote e validade — **entregue em 2026-11-03** (ver abaixo).
3. PDV com baixa PVPS, pagamentos múltiplos e recibo — **entregue em parte em 2026-11-05** (ver abaixo).
4. Caixa diário: abertura, sangria, suprimento e fechamento cego/analítico — **entregue em 2026-11-05** (ver abaixo).
5. Alertas de validade e estoque mínimo, e relatório de reposição.
6. Painel financeiro com CMV histórico — **entregue em 2026-11-05** (ver abaixo; antecipado antes do item 5).
7. PWA instalável e leitor por câmera.

## Fora do escopo

- Desconto manual no checkout (o PDV não terá esse campo).
- Dedução de despesas fixas (aluguel, energia, salários): o lucro é só a margem bruta, faturamento menos CMV.
- Emissão fiscal (NFC-e/SAT) e integração com TEF ou maquininha: não foram pedidas.

## Requisitos

- **Sigilo:** custos, CMV e margens nunca chegam ao perfil `CASHIER`, nem pela API.
- **Caixa único:** só um caixa aberto por vez no estabelecimento. Sem caixa ativo, o servidor recusa vendas.
- **PVPS:** a baixa de estoque é sempre pelo lote que vence primeiro.
- **Dinheiro:** o total da venda é exatamente a soma dos itens já arredondados ao centavo. O CMV é gravado no momento da venda.
- **Sessão e segurança:** sessão por cookie opaco com registro no banco, cabeçalho anti-CSRF e limite de 10 tentativas de login a cada 15 minutos por IP.
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
- **E-mail:** Resend, chamado por `fetch` na API HTTP (sem SDK), usado hoje nos códigos de cadastro, recuperação de senha e convite e no resumo financeiro do dia e, depois, no alerta diário de reposição. A chave (`RESEND_API_KEY`) fica só no servidor. Sem chave e fora de produção, o e-mail só vai para o log.
- **Uma loja por instalação:** o servidor atende uma única loja, criada no cadastro inicial (`/cadastro`), que só existe enquanto não há loja. Usuários novos entram por convite de um `ADMIN`.
- **Login por e-mail:** o e-mail identifica o usuário (trim e minúsculas). O mesmo login leva o `ADMIN` ao painel e o `CASHIER` à frente de caixa (`/caixa`); o painel continua exclusivo de `ADMIN`.
- **Demonstração só em desenvolvimento:** `npm run db:seed` e os botões de login de demonstração não funcionam em produção.
- **Organização:** features em `src/domains`, integrações em `src/infrastructure`, contratos em `src/contracts`. Rotas finas, serviços independentes do Next.js e acesso a dados por repositories. Detalhes em [docs/architecture.md](docs/architecture.md).

## Premissas e decisões pendentes

| Item                               | Tipo                | Impacto e próximo passo                                                                                                                                                                                                                                             |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Item                               | Tipo                | Impacto e próximo passo                                                                                                                                                                                                                                             |
| ---                                | ---                 | ---                                                                                                                                                                                                                                                                 |
| Migração de dados do sistema atual | Pendente (externa)  | Definir se cadastros e histórico existentes serão importados. A importação por planilha cobre produtos e estoque inicial                                                                                                                                            |
| CSP "sem scripts inline"           | Premissa reversível | O Next.js injeta scripts de inicialização; a proposta é CSP com nonce por requisição, que mantém só scripts do próprio servidor. Validar na tarefa de segurança                                                                                                     |
| Valores monetários                 | Premissa reversível | Centavos inteiros; peso em gramas; total do item arredondado ao centavo; total da venda é a soma dos itens                                                                                                                                                          |
| Loja única                         | Premissa reversível | Um estabelecimento por instalação, sem multiempresa                                                                                                                                                                                                                 |
| Comprovante por WhatsApp           | Premissa reversível | Link `wa.me` com texto pré-formatado, sem API paga do WhatsApp                                                                                                                                                                                                      |
| Conta Resend e domínio remetente   | Parcial (externa)   | Chave configurada e envio real verificado em 2026-11-01 com remetente de teste `@resend.dev`, que só entrega para o e-mail da conta Resend. Falta verificar um domínio próprio e trocar `MAIL_FROM` antes de convidar usuários ou enviar o resumo e o alerta diário |
| Domínio fixo do Cloudflare Tunnel  | Pendente (externa)  | Domínio na conta Cloudflare para o túnel nomeado, para o atalho do PWA não perder o acesso                                                                                                                                                                          |
| Lote e validade na importação      | Pendente            | As colunas obrigatórias não trazem lote nem validade, mas toda entrada de estoque exige lote e validade (ou "sem validade"). Definir se a importação cria um lote "sem validade" ou aceita colunas opcionais `Lote` e `Validade`                                    |
| Formato dos valores na planilha    | Premissa reversível | Preços em reais com vírgula ou ponto decimal; `Estoque` em unidades (em quilos para pesáveis); cabeçalhos exatamente como definidos, sem diferenciar maiúsculas                                                                                                     |

## Critérios de aceite

**Produto (por fluxo, a validar quando cada um for implementado):**

- Um `CASHIER` não consegue obter custo, CMV ou margem por nenhuma tela ou rota da API.
- Sem caixa aberto, o servidor recusa a venda mesmo que o cliente envie a requisição.
- Uma venda com dois lotes do mesmo produto baixa primeiro o de validade mais próxima.
- O total de uma venda com itens pesáveis é igual à soma dos itens arredondados ao centavo.
- O fechamento cego não mostra o valor esperado ao operador; o administrador vê a quebra.
- A 11ª tentativa de login de um mesmo IP em 15 minutos é bloqueada.
- Produtos com estoque igual ou abaixo do mínimo aparecem em amarelo no painel (em vermelho com o estoque zerado) e entram na lista de reposição.

**Base técnica:** `npm run check` verde, PostgreSQL local saudável e conectado, imagem Docker de produção construída e respondendo. Evidências em [docs/setup.md](docs/setup.md).

## Entregue: autenticação

- Tabela `users` (papéis `ADMIN`/`CASHIER`, senha com hash scrypt) na primeira migration.
- Login por cookie HTTP-only com sessão no banco (30 dias deslizantes com "Manter conectado"; senão cookie de navegador e 12 h) com token anti-CSRF exigido em toda requisição autenticada que altera estado, e recusa de requisições de outra origem.
- Proxy e cada rota aplicam a mesma regra. Desde 2026-11-05 o `CASHIER` entra pelo mesmo login e vai para `/caixa`. Só são públicos `/`, `/login`, `/cadastro`, `/recuperar`, `/design-system`, `/api/setup`, `/api/theme` e as rotas de login, cadastro (início, verificação, reenvio) e redefinição de senha (pedido, confirmação) em `/api/auth`; sair (`/api/auth/logout`) exige sessão e todo o resto exige sessão, e `/painel`, `/api/admin`, `/api/account` e `/api/store` são exclusivos de `ADMIN`.
- Limite de 10 logins por IP a cada 15 minutos; a 11ª tentativa recebe 429 com `Retry-After`.
- Contrato OpenAPI em `src/contracts/openapi.json`, verificado por `npm run spec:check`.
- Primeiro usuário pelo "Criar conta da loja" em `/login` (cadastro em 3 etapas com código por e-mail), ou, em desenvolvimento, por `npm run db:seed`; `npm run user:create -- <email> "<Nome>" <ADMIN|CASHIER>` cria usuários pela linha de comando.
- Entregues: troca de senha, recuperação de senha por e-mail, "Encerrar outras sessões", convite e gestão da equipe no painel (`/painel/usuarios`), registro de atividade e configurações da loja.

**Critério verificado:**

- Um `CASHIER` recebe 403 em `/api/admin`, `/api/account` e `/api/store`; ao abrir uma página de `/painel`, vai para `/caixa`. Até 2026-11-05 o login dele era recusado; agora ele entra e cai na frente de caixa.
- O 11º login do mesmo IP recebe 429.

Comprovado por testes automatizados e contra o servidor real (ver docs/setup.md).

## Catálogo e estoque (entregue em 2026-11-03)

Telas `/painel/produtos` e `/painel/estoque`:

- produtos unitários e pesáveis, com custo visível só para `ADMIN`;
- entrada de estoque com lote e validade, ou "item não vence";
- lotes por produto com o semáforo de validade e estoque.

Critério atendido: a busca do caixa (`GET /api/products`) não devolve o preço de custo, e uma entrada sem lote ou sem validade é recusada pelo servidor (ver docs/quality.md).

Desde 2026-11-05, `/painel/estoque` também dá baixa manual (quantidade e motivo, por PVPS), que é como um lote vencido sai da prateleira. Ficam para depois: ajustes, extrato de movimentações e importação por planilha.

## Frente de caixa (entregue em parte em 2026-11-05)

Tela `/caixa`, aberta a `ADMIN` e `CASHIER`:

- leitor USB ou busca por nome, com atalhos F1, F2, Esc e Enter e todos os controles com 60 px ou mais;
- recusa, no cliente e no servidor, do produto sem saldo ou com o próximo lote vencido;
- itens unitários e pesáveis (peso no teclado numérico), com o total de cada item arredondado ao centavo;
- pagamento em dinheiro (com troco), Pix, débito ou crédito, uma forma por venda;
- baixa PVPS de todos os itens numa transação, com preço e custo (CMV) gravados na venda;
- comprovante impresso pelo navegador (bobina de 58 ou 80 mm) ou enviado por link do WhatsApp.

Critério atendido: uma venda com dois lotes do mesmo produto baixa primeiro o de validade mais próxima, e o total de uma venda com item pesável é a soma dos itens arredondados (ver docs/quality.md).

Fica para depois o leitor por câmera (exige HTTPS). Pagamento dividido, desconto e fiado entraram em 2026-11-06 (seção abaixo).

### Etiqueta de balança (entregue em 2026-11-06)

O PDV lê a etiqueta impressa pela balança do açougue ou do hortifrúti, um EAN-13 que começa com 2:

- `20` + código do produto (5 dígitos) + valor total em centavos (5 dígitos) + dígito verificador: o peso vendido é o valor dividido pelo preço por kg do catálogo, arredondado para baixo ao grama, então o cliente nunca paga mais que o valor impresso (no máximo o preço de 1 g a menos);
- `21` + código do produto (5 dígitos) + peso líquido em gramas (5 dígitos) + dígito verificador: vende o peso impresso (1500 g = 1,500 kg).

O código de 5 dígitos é o código de barras do produto pesável no cadastro (ex.: `00123`), o mesmo cadastrado na balança; o formulário do produto vendido por quilo lembra isso. O preço cobrado é sempre o do catálogo, calculado pelo servidor. A leitura procura primeiro o código completo; só um código sem cadastro, com 13 dígitos, prefixo `20` ou `21` e dígito verificador válido vira etiqueta. A etiqueta só vale para produto vendido por quilo, e as recusas de lote vencido e de estoque continuam valendo. Implementação em `src/lib/barcode-scale.ts`.

## Caixa diário (entregue em 2026-11-05)

Na frente de caixa (`/caixa`), para os dois perfis:

- sem caixa aberto, a tela só mostra a abertura com o troco inicial, e o servidor recusa qualquer venda ("Não é possível realizar vendas com o caixa fechado.");
- sangria (F8) e suprimento (F9) com motivo obrigatório;
- fechamento cego (F4): o operador informa o dinheiro contado e nunca vê o esperado, nem na tela nem nas respostas da API; com uma venda em andamento, o fechamento espera ela ser finalizada ou cancelada.

No painel (`/painel/caixa`, só `ADMIN`), o histórico de caixas com troco inicial, vendas em dinheiro, suprimentos, sangrias, esperado (troco inicial + vendas em dinheiro + suprimentos − sangrias), contado e quebra (sobra ou falta), com o último fechamento em destaque.

Um único caixa aberto por vez, garantido pelo banco. Cada venda fica ligada ao caixa em que entrou. Uma venda e um fechamento simultâneos não deixam a venda fora do esperado.

Critérios atendidos: sem caixa aberto, o servidor recusa a venda mesmo que o cliente envie a requisição; o fechamento cego não mostra o valor esperado ao operador, e o administrador vê a quebra (ver docs/quality.md).

## Relatórios financeiros (entregue em 2026-11-05)

Tela `/painel/relatorios`, só `ADMIN`:

- períodos Hoje, Últimos 7 dias (hoje e os 6 anteriores), Últimos 30 dias, Mês atual e Período livre (até 366 dias), sempre em dias do fuso da loja: uma venda às 23h30 conta no dia em que foi feita na loja;
- faturamento bruto, CMV (custo gravado em cada item na hora da venda), lucro bruto, margem bruta (%) com selo verde a partir de 20%, amarelo de 10% a menos de 20% e vermelho abaixo de 10%, ticket médio, quantidade de vendas e de itens (cada linha pesável conta como 1 item);
- distribuição por forma de pagamento (total, vendas e participação) e os 5 produtos com mais quantidade, faturamento ou lucro;
- histórico paginado das vendas com horário da loja, operador, forma de pagamento, faturamento, CMV e margem de cada venda;
- botão que envia o resumo financeiro de hoje, em HTML e texto, para o e-mail do administrador logado (até 5 envios por hora). Em produção sem `RESEND_API_KEY`, o envio é recusado com aviso; fora de produção, vai para o log.

Critério atendido: o total de cada período é a soma das vendas do período, e o CMV é o custo gravado na venda, não o custo atual do catálogo (ver docs/quality.md).

## Fornecedores e reposição (entregue em 2026-11-05)

- `/painel/fornecedores` (só `ADMIN`): cadastro com busca, edição e inativação; CNPJ/CPF opcional e único, WhatsApp com DDD, contato e e-mail.
- `/painel/produtos`: cada produto pode ter um fornecedor padrão e o código que esse fornecedor usa. Um fornecedor inativo não pode ser escolhido de novo.
- `/painel/estoque/reposicao`: produtos ativos no estoque mínimo ou abaixo, ou com lote vencido ou vencendo em até 30 dias (semáforo amarelo e vermelho), com a sugestão de compra 2 × mínimo − estoque (nunca negativa), agrupados pelo fornecedor padrão ativo.
- Botão "Enviar pedido" por fornecedor: link `wa.me` para o WhatsApp dele (com 55 quando falta), com os dados da loja, os itens a comprar, o código no fornecedor e as quantidades. O envio é feito pela pessoa no WhatsApp; nenhuma API paga.

Critério atendido: produtos com estoque igual ou abaixo do mínimo aparecem em amarelo (vermelho com o estoque zerado) e entram na lista de reposição (ver docs/quality.md).

Ficam para depois: alerta diário de reposição por e-mail, histórico de pedidos e previsão de compras (semana 8).

## Revisão de interface (2026-11-06)

No balcão, todo controle tem 60 px ou mais. Os campos usam 16 px em qualquer tamanho, para o Safari do iOS não dar zoom. Nenhuma rota rola de lado em 375 px. Selos, semáforo, botões e textos têm contraste de 4,5:1 ou mais nos dois temas. Detalhes e evidências em `DESIGN.md` e `docs/quality.md`.

## Fiado, desconto e pagamento dividido (entregue em 2026-11-06)

- `/painel/clientes` (só `ADMIN`): cadastro com busca, edição e inativação; CPF/CNPJ opcional e único, WhatsApp e limite de crédito em R$ (zero não permite fiado). A lista mostra o saldo devedor e avisa quando ele passou do limite, o que acontece quando o limite é baixado depois das compras.
- Extrato do cliente: saldo devedor, limite, disponível e, do mais novo para o mais antigo, cada compra no fiado (com o número da venda) e cada pagamento.
- Quitação total ou parcial: o pagamento abate o saldo devedor na mesma transação em que é gravado, nunca abaixo de zero, e gera comprovante para impressão ou para o WhatsApp do cliente. O recebimento não entra no caixa do PDV; dinheiro posto na gaveta é um suprimento.
- PDV, desconto (F3 ou botão "Desconto"): em R$ ou em % do total dos itens, nunca acima dele. O percentual arredonda ao centavo e acompanha o total se um preço mudar.
- PDV, pagamento dividido: cada valor menor que o que falta vira uma linha (uma por forma, somando), e o valor que cobre o resto finaliza a venda. Só o dinheiro dá troco, e o troco sai dele. Com o campo vazio, Enter paga o que falta na forma escolhida.
- PDV, fiado: escolhe o cliente ativo pelo nome; o operador vê só o nome e o crédito disponível, nunca documento ou telefone. Se saldo devedor + fiado passar do limite, a venda é bloqueada com aviso de perigo, na tela e no servidor (a conferência do servidor vale também quando outro balcão mudou o limite ou o saldo).
- O caixa diário conta só a parte em dinheiro de cada venda; os relatórios mostram cada forma com a sua parte (Fiado incluso) e o desconto de cada venda no histórico. O faturamento, o CMV e a margem já contam o desconto; os 5 mais vendidos (e o lucro por produto) usam o valor dos itens antes dele, porque o desconto é da venda, não de um item.

Critérios atendidos: o fiado acima do limite é recusado sem gravar nada, inclusive com duas vendas simultâneas, e o saldo devedor sobe com a venda e desce com a quitação de forma atômica (ver docs/quality.md).

Ficam para depois: VR/VA como forma de pagamento, desconto por item, limite de desconto por perfil e cobrança automática de fiado vencido.

## Próxima entrega

**PWA instalável e leitor por câmera** (MVP item 7), que dependem do HTTPS do túnel. Calendário em [ROADMAP.md](ROADMAP.md).

**Endurecimento pendente:** CSP com nonce (scripts só do próprio servidor), numa tarefa própria de segurança.

## Manutenção

Atualize este documento quando objetivo, escopo, restrições ou critérios de aceite mudarem. Decisões técnicas detalhadas e evidências ficam em `docs/architecture.md` e `docs/setup.md`.
