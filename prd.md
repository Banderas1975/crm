# PRD — First Media CRM

## O que é e pra quem

Um CRM simples para organizar contatos e oportunidades de negócio em um só lugar. É para quem vende sozinho ou em time pequeno e hoje controla tudo em planilha, caderno ou na memória. O objetivo é saber, a qualquer momento, com quem falar e em que pé está cada negociação.

## Funcionalidades da primeira versão

- [x] Cadastro e listagem de contatos
- [x] Telefone com indicativo de país — seletor com todos os países, número guardado no formato internacional (`+351 912345678`); Portugal exige exatamente 9 dígitos, os outros países aceitam de 4 a 15 no total
- [x] Funil com etapas: novo, em contato, proposta, cliente (e "perdido", desde a v8)
- [x] Anotações por contato
- [x] Login de administrador
- [x] Follow-up gerado por IA
- [x] Painel com os números do funil
- [x] Publicação na internet
- [x] Vários usuários com aprovação e papéis — qualquer pessoa cria conta sozinha, mas só entra depois que um administrador aprova; na tela de Usuários o administrador aprova, recusa, remove acesso e decide quem é admin ou usuário comum. Construído depois, fora do plano original.

## Versão 2

- [x] **Sistema com áreas em vez de página única** — navegação lateral fixa com Dashboard, Funil, Contatos e Usuários (este só para admin), cada uma em tela própria, sob a identidade escura descrita no `design.md`. Nenhuma funcionalidade nova: é a mesma coisa reorganizada.

### 1. Kanban do funil — CONCLUÍDO

Ver e mover os contatos entre as etapas arrastando, em vez da lista vertical de hoje.

Ao virar cartões, o Funil deixou de ter espaço para as anotações e o follow-up que ficavam dentro da lista. Esse conteúdo mudou-se para a página do contato (item 2), que já existe: clicar num cartão abre-a.

**PRONTO QUANDO**

- [ ] Abro o Funil e vejo quatro colunas — novo, em contato, proposta, cliente — cada uma com o nome da etapa na cor dela e a contagem de contatos
- [ ] Arrasto um cartão de uma coluna para outra, recarrego a página e ele continua na coluna nova
- [ ] Volto ao Dashboard e o número daquela etapa mudou junto
- [ ] Consigo mudar a etapa de um contato **sem usar o mouse**, só pelo teclado — arrastar não é o único caminho
- [ ] Numa janela estreita (ou no celular) as colunas continuam legíveis e ainda consigo mudar a etapa de um contato

### 2. Página do contato — CONCLUÍDO

Tudo de um contato num lugar só: dados, etapa, anotações e os follow-ups já gerados para ele. Mais uma busca para chegar até lá depressa.

Os follow-ups deixaram de se perder: são gravados na tabela `follow_ups`, com data, e ficam listados na página para reler e copiar. Foi a única mudança de banco da v2.

**PRONTO QUANDO**

- [ ] Clico no nome de um contato e abro a página dele, com endereço próprio que posso copiar e abrir noutro separador
- [ ] Nessa página vejo, sem sair dela: nome, email, telefone, etapa atual, todas as anotações e todos os follow-ups já gerados
- [ ] Mudo a etapa, escrevo uma anotação e gero um follow-up ali mesmo; recarrego a página e as três coisas continuam lá
- [ ] Escrevo parte de um nome, email ou telefone na busca, o contato aparece e um clique me leva à página dele
- [ ] Busco por algo que não existe e recebo um "nada encontrado" claro, sem erro e sem tela em branco

### 3. Dashboard v2 — CONCLUÍDO

Os números do funil apresentados como painel de sistema, com um gráfico simples da distribuição por etapa e os cinco contatos mais recentes, cada um a levar à sua página.

O gráfico é HTML e CSS, sem biblioteca. As barras são medidas contra a etapa maior, não contra o total: assim uma etapa com poucos contatos continua visível em vez de virar um risco fino.

**PRONTO QUANDO**

- [ ] Abro o Dashboard e vejo o total de contatos e o número de cada etapa, cada um na cor da sua etapa
- [ ] Vejo um gráfico da distribuição por etapa que me diz de relance onde está a maior parte dos contatos, com as mesmas cores do funil
- [ ] Movo um contato de etapa no Funil, volto ao Dashboard e o número **e** o gráfico mudaram juntos
- [ ] Com a base vazia, ou com uma etapa a zero, o gráfico não quebra: mostra o vazio de forma legível
- [ ] Numa janela estreita o painel e o gráfico continuam legíveis, sem a página rolar para o lado

## Versão 3

### 1. Tarefas — CONCLUÍDO

O que tem de ser feito, e com quem. Cada tarefa pertence sempre a um contato: é criada na página dele e some com ele se o contato for apagado (`on delete cascade`, decidido pelo banco).

A área **Tarefas** mostra cinco secções, nesta ordem: **Atrasadas · Hoje · Esta semana · Próxima semana · Sem data**. Todos os dias são contados em `Europe/Lisbon`, e a data de vencimento é guardada como dia (`date`), não como instante — assim não há fuso para converter na leitura.

"Esta semana" vai de amanhã até domingo; "Próxima semana" é a semana seguinte inteira, de segunda ao domingo a seguir. Uma tarefa marcada para depois disso ainda não aparece na agenda — vê-se na página do contato, e entra quando a data se aproximar.

Três decisões que respondem a restrições dadas:

- **Nunca há tarefas infinitas.** Uma tarefa repetida só gera a seguinte no momento em que a atual é concluída, uma de cada vez. Não existe fila à espera no banco.
- **Nunca há avisos duplicados.** O único aviso é o contador ao lado de "Tarefas" na navegação, com as atrasadas mais as de hoje. É contado no banco a cada visita e não fica guardado — não há estado que possa duplicar. (Desde a v9 há também emails de aviso, com a mesma regra de nunca duplicar.)
- **Concluir é atómico.** O "ainda não está concluída" faz parte do próprio UPDATE, por isso dois cliques seguidos (ou dois separadores abertos) não geram duas repetições nem duas entradas no histórico.

Tarefas concluídas saem das quatro secções e ficam no histórico da página do contato, com a data.

**PRONTO QUANDO**

- [ ] Crio uma tarefa na página de um contato e ela aparece na secção certa da área Tarefas
- [ ] Uma tarefa marcada para a semana seguinte aparece em "Próxima semana", e não em "Esta semana"
- [ ] O contador ao lado de "Tarefas" conta as atrasadas mais as de hoje, e muda quando concluo uma
- [ ] Concluo uma tarefa que se repete e nasce **exatamente uma** seguinte, com a data adiantada
- [ ] Concluo a mesma tarefa duas vezes seguidas e continua a haver só uma seguinte
- [ ] Apago um contato no Supabase e as tarefas dele desaparecem com ele

## Versão 4

### 1. Propostas — CONCLUÍDO

As propostas enviadas a cada contato, guardadas na página dele. Cada proposta é um ficheiro com um valor em euros, e o negócio pode ser marcado como ganho com o valor de uma delas.

O CRM não tem "negócio" à parte: o contato é o negócio. **Ganho é estar na etapa "cliente".** O funil continua com as mesmas quatro etapas e as mesmas cores.

Regras dadas:

- **Até 4,5 MB por proposta.** Conferido no navegador (para avisar antes de enviar), na action e no próprio bucket do Supabase. Na VPS, o nginx tem de aceitar pelo menos isso (`client_max_body_size 6m;`, em `/etc/nginx/conf.d/crm-upload.conf`); se um dia recusar um envio, o formulário mostra o aviso por baixo e a página fica onde está, em vez de ir para o ecrã de erro.
- **Só PDF, DOCX e XLSX.** Não basta a extensão: o servidor olha para os primeiros bytes do ficheiro, e um `.pdf` que não é PDF é recusado.
- **Acrescentar, nunca apagar.** Anexar uma proposta nova não toca nas anteriores: cada envio é uma linha nova e um ficheiro novo, com nome próprio, e o envio não substitui nada (`upsert` desligado). A app não tem botão para apagar nem trocar propostas.
- **Ganho com o valor da proposta.** Anexar não fecha nada — enviar uma proposta não é ganhá-la. Cada proposta tem "Marcar como ganho": o contato passa a "cliente" e a página mostra o valor ganho, lido dessa proposta. Se mais tarde o contato sair de "cliente", o ganho desfaz-se.

**Proteção de dados (RGPD).** Uma proposta traz dados pessoais e comerciais do contato; nada dela pode sair do CRM:

- O bucket `propostas` é **privado**. Não há links públicos nem links assinados que se possam reencaminhar.
- A única forma de abrir uma proposta é `/propostas/<id>`, que exige sessão de utilizador **aprovado**, verificada no banco a cada pedido.
- No Storage o ficheiro chama-se por um código aleatório (`<id do contato>/<código>.pdf`): nenhum nome de pessoa ou empresa aparece em caminhos, links ou logs. O nome original fica só no banco.
- O download sai sempre como anexo, com `no-store` (nem o navegador nem servidores pelo meio guardam cópia), `nosniff` e sem `Referer`.
- A tabela tem RLS ligado e sem políticas: só o servidor, com a chave secreta, lê e grava. A chave nunca sai do servidor.
- Os logs do servidor registam só a mensagem de erro, nunca o conteúdo nem o nome do ficheiro.
- Desde a v6, cada utilizador só vê e descarrega as propostas dos seus contatos.
- **Direito ao apagamento:** apagar um contato no Supabase apaga as linhas das propostas, mas não os ficheiros. Para apagar tudo de uma pessoa: primeiro, em Storage, a pasta `propostas/<id do contato>`; depois o contato.

As mudanças de banco estão em `sql/propostas.sql`: a tabela `propostas`, a coluna `contatos.proposta_ganha_id` e o bucket.

**PRONTO QUANDO**

- [ ] Na página de um contato anexo um PDF, um DOCX e um XLSX, cada um com valor, e os três aparecem na lista com nome, valor, tamanho e data
- [ ] Anexo uma segunda proposta a um contato que já tinha uma e as duas continuam lá
- [ ] Tento anexar um ficheiro com mais de 4,5 MB e recebo um aviso claro, sem nada guardado
- [ ] Tento anexar um `.png`, ou um ficheiro renomeado para `.pdf` que não é PDF, e é recusado
- [ ] Carrego em "Marcar como ganho" numa proposta: o contato passa a "cliente", a página mostra "Ganho" com o valor dela, e o Funil e o Dashboard mudam junto
- [ ] Clico no nome de uma proposta e ela descarrega com o nome original
- [ ] Numa janela sem sessão, abro o endereço `/propostas/<id>` e caio no login, sem ficheiro
- [ ] No Supabase o bucket `propostas` está marcado como privado e os ficheiros não têm nomes de pessoas

## Versão 5

### 1. Calendário e reuniões — CONCLUÍDO

A área **Calendário** mostra tarefas e reuniões em três vistas: **mês**, **semana** e **dia**. As semanas começam à segunda. Tudo é mostrado e gravado em hora de **Lisboa** (`Europe/Lisbon`), esteja o computador de quem usa noutro fuso ou não: o navegador recebe as horas já convertidas e nunca faz contas de fuso.

**Reunião** é uma entidade nova: assunto, dia e hora de início, duração (15 min a 4 h), local (opcional) e participantes. Pertence sempre a um contato — o principal — e some com ele (`on delete cascade`). Os outros participantes escolhem-se de duas listas: **outros contatos** do CRM e **utilizadores da equipa**. Não há participantes escritos à mão.

- Na **página do contato**, a secção **Reuniões** marca reuniões novas e mostra todos os detalhes: dia, hora de início e de fim, duração, local e participantes. As que já acabaram ficam em "Já realizadas". Um contato que é só participante vê a reunião, com o link para o contato onde foi marcada.
- No **Calendário**, tarefas e reuniões **arrastam-se**. No mês, largar num dia muda o dia (a reunião mantém a hora). Na semana e no dia, largar na grelha muda o dia e a hora da reunião, em passos de 30 minutos. As tarefas continuam a ter só dia, sem hora.
- **Sem rato:** selecionar com Tab e usar ← → para mudar o dia; ↑ ↓ mudam a hora da reunião (30 min) ou a semana da tarefa.
- Como no Funil, o cartão muda de sítio logo; se o servidor recusar, volta sozinho e aparece o aviso.
- Uma reunião marcada numa hora que não existe (entre a 1h e as 2h do dia em que se muda para a hora de verão) fica uma hora mais tarde.

As mudanças de banco estão em `sql/reunioes.sql`: tabelas `reunioes`, `reuniao_contatos`, `reuniao_usuarios` e `tentativas_login`, todas com RLS ligado e sem políticas.

**PRONTO QUANDO**

- [ ] Abro o Calendário e vejo o mês atual, com as tarefas por fazer e as reuniões nos dias certos
- [ ] Mudo entre mês, semana e dia, e as setas levam ao mês, semana ou dia anterior e seguinte; "Hoje" volta a hoje
- [ ] Marco uma reunião na página de um contato, com outro contato e um utilizador como participantes, e vejo os detalhes todos
- [ ] A reunião aparece no Calendário à hora que escrevi, e na página do outro contato como participante
- [ ] Arrasto uma tarefa para outro dia, recarrego, e ela continua no dia novo
- [ ] Arrasto uma reunião na vista semana para outra hora, recarrego, e ela continua na hora nova
- [ ] Mudo uma reunião de dia e hora só com o teclado
- [ ] Com o computador noutro fuso horário, as horas continuam a ser as de Lisboa

### 2. Segurança — CONCLUÍDO

- **Cabeçalhos de segurança em todas as páginas.** A CSP (Content Security Policy) só deixa correr os scripts do próprio CRM que tragam o código (nonce) daquele pedido: um script escondido num nome de contato ou numa anotação não corre. Há também anti-moldura (`X-Frame-Options: DENY` e `frame-ancestors 'none'`), HSTS (só HTTPS), `nosniff`, `Referrer-Policy`, e câmara, microfone e localização desligados. O Next deixa de anunciar que é Next (`X-Powered-By`).
- **Travão no login.** 5 senhas erradas seguidas para o mesmo email bloqueiam esse email durante 15 minutos. Enquanto está bloqueado, nem a senha certa entra. Conta por email, exista a conta ou não, para o bloqueio não revelar que emails estão registados. A senha certa recomeça a contagem. (Desde a v16 conta por email **e ligação**, mais um limite por ligação: ver a v16.)

**PRONTO QUANDO**

- [ ] Nas ferramentas do navegador (Rede), qualquer página do CRM traz `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security` e não traz `X-Powered-By`
- [ ] Erro a senha 5 vezes e aparece a mensagem de bloqueio; à 6.ª, mesmo com a senha certa, continua bloqueado
- [ ] Passados 15 minutos entro com a senha certa

### 3. Lista de todos os contatos — CONCLUÍDO

Para quem não se lembra do nome: na área Contatos, a seguir ao cartão "Novo contato", a lista de todos os contatos por ordem alfabética, 50 por página, com Anterior/Seguinte. Cada nome leva à página do contato. Mudar de página não apaga a busca que estiver feita.

**PRONTO QUANDO**

- [ ] Abro Contatos e vejo, depois do "Novo contato", os primeiros 50 contatos por ordem alfabética e o total
- [ ] Com mais de 50 contatos, "Seguinte" mostra os próximos 50, e "página X de Y" diz onde estou
- [ ] Clico num nome da lista e abro a página desse contato

## Versão 6

### 1. Cada utilizador só vê o que é seu — CONCLUÍDO

Cada contato tem um **dono** (`dono_id`), e tudo o que pende dele também: anotações, follow-ups, tarefas, propostas, reuniões e participantes. Cada utilizador vê e mexe só no que é seu, em todas as áreas: Dashboard, Funil, Tarefas, Calendário, Contatos (busca e lista) e página do contato.

- Os contatos que existiam antes passaram para o **administrador principal** (o admin aprovado mais antigo). Todos os outros utilizadores, atuais e novos, começam com o CRM **em branco**.
- O administrador também só vê os seus contatos. Ser admin serve para gerir contas (aprovar, recusar, tirar acesso, papéis), não para ver os dados dos outros.
- Abrir o endereço de um contato, ou de uma proposta, que é de outro utilizador dá "não encontrado", igual a um que não existe, sem pistas.
- Na reunião, "Outros contatos" mostra só os contatos do próprio. "Da equipa" continua a listar os emails de todos os utilizadores aprovados; marcá-los como participantes não lhes dá acesso à reunião.
- Uma conta que tem contatos **não pode ser apagada** (o banco recusa): os dados de ninguém desaparecem por um clique. "Recusar" só apaga contas à espera de aprovação.

**Dupla barreira.** Cada consulta no servidor filtra pelo dono de quem pede. Além disso, o próprio banco recusa ligar dados de donos diferentes: uma tarefa, anotação, proposta ou reunião só pode apontar para um contato do mesmo dono (chave estrangeira composta contato + dono), e um participante tem de ser do mesmo dono que a reunião. Mesmo um erro futuro no código não consegue cruzar dados entre utilizadores.

As mudanças de banco estão em `sql/donos.sql`, que corre tudo de uma vez ou nada (e mostra no fim quantos contatos ficou a ter cada utilizador).

**PRONTO QUANDO**

- [ ] Depois do SQL, o administrador principal continua a ver todos os contatos de antes, com tarefas, reuniões e propostas
- [ ] Crio e aprovo uma conta nova, entro com ela e o Dashboard, o Funil, as Tarefas, o Calendário e os Contatos estão vazios
- [ ] Com a conta nova crio um contato; o administrador não o vê, nem na busca nem pelo endereço
- [ ] Com a conta nova, abro o endereço de um contato ou de uma proposta do administrador e recebo "não encontrado"

### 2. Auditoria de segurança — CONCLUÍDO

Corrigido o que a revisão do código encontrou:

- **Ações sem dono.** Editar e apagar anotações, concluir e mover tarefas, mover reuniões, mudar a etapa, marcar ganho e descarregar propostas aceitavam qualquer id, sem confirmar a quem pertencia. Agora todas confirmam o dono.
- **Login denunciava contas.** Com um email que não existe, a resposta vinha mais depressa (não havia senha para conferir). Agora confere-se sempre uma senha, e o tempo é igual.
- **Recusar apagava qualquer conta.** Passou a apagar só contas à espera de aprovação.
- **Funções de verificação expostas.** `exigirSessao` e `exigirAdmin` estavam num ficheiro de ações do servidor, onde cada função exportada é um endereço que se pode chamar de fora. Mudaram para `app/acesso.js`, só de servidor.

### 3. Ver a senha no login — CONCLUÍDO

No login, o campo Senha tem um botão **Mostrar** / **Ocultar** para conferir o que se escreveu. Começa sempre escondida, funciona com rato e com teclado, e o que já foi escrito não se perde ao alternar.

**PRONTO QUANDO**

- [ ] Escrevo a senha no login, carrego em "Mostrar" e vejo-a; carrego em "Ocultar" e volta aos pontos
- [ ] Chego ao botão com Tab e alterno com Enter, sem enviar o formulário

## Versão 7

### 1. Exportar contatos para Excel — CONCLUÍDO

Na área Contatos, no cartão "Todos os contatos", escolhe-se o lote e carrega-se em **Exportar**: sai um ficheiro **.xlsx** com até **500 contatos** (Lote 1 = contatos 1 a 500, Lote 2 = 501 a 1000…), pela mesma ordem alfabética da lista.

- Colunas: Nome, Email, Telefone, Etapa, Criado em (hora de Lisboa). Cabeçalho a negrito e fixo ao rolar.
- **Codificação:** o .xlsx é sempre UTF-8 por dentro — o formato obriga — e o Excel abre-o com os acentos certos sem escolher nada. O Windows-1252 pedido aplica-se a ficheiros .csv; ficou decidido usar .xlsx.
- O ficheiro é gerado no momento, no servidor, sem biblioteca externa (`lib/xlsx.js`), e não fica guardado em lado nenhum.
- **Proteção de dados:** cada utilizador só exporta os seus contatos; sem sessão vai para o login; o download vai com `no-store` (sem cópias em cache). Todas as células são texto: um nome começado por "=" não é lido como fórmula quando se abre o ficheiro.

**PRONTO QUANDO**

- [ ] Em Contatos vejo a lista de lotes, com quantos contatos tem cada um, e o botão Exportar
- [ ] Exporto o Lote 1 e o Excel abre um ficheiro com até 500 contatos, com acentos certos
- [ ] Com mais de 500 contatos, o Lote 2 traz os seguintes, sem repetir nenhum
- [ ] Com outra conta, a exportação só traz os contatos dessa conta

## Versão 8

### 1. Relatórios no Dashboard — CONCLUÍDO

Cinco relatórios fixos, por baixo do painel do Dashboard, com **dois filtros comuns**: **período** (de/até, por omissão do início do ano até hoje) e **origem**. Cada relatório tem **Exportar .xlsx**, com os mesmos filtros, valores como números (para somar no Excel) e uma folha final com os filtros usados.

O filtro **responsável** não existe: desde a v6 cada utilizador só vê o que é seu, admin incluído, e por isso só haveria uma opção. Foi decidido manter essa privacidade.

1. **Funil de conversão** — dos contatos que entraram no período: quantos chegaram a cada etapa (estar numa etapa mais à frente conta como ter passado pelas anteriores), o valor, a taxa de passagem à etapa seguinte e o tempo médio em cada etapa (só estadias já terminadas).
2. **Receita vs meta** — por mês: receita dos negócios ganhos, meta, % atingido. No mês corrente: ritmo (€/dia), projeção para o fim do mês e quanto falta por dia. Por cliente: cada negócio ganho, com data, origem e valor. As metas escrevem-se ali mesmo, uma por mês (gravar o mesmo mês substitui).
3. **Pipeline aberto** — fotografia de agora: negócios em novo, em contato e proposta, por etapa, com valor e valor ponderado pela probabilidade (novo 10%, em contato 25%, proposta 50%), e a lista por data de fecho prevista (as que já passaram ficam assinaladas). Não usa o período — os fechos previstos são no futuro.
4. **Motivos de perda** — negócios perdidos no período, por motivo, com parte e valor perdido.
5. **Origem → receita** — por canal: leads que entraram no período, quantos já são clientes, conversão, negócios ganhos, receita e ticket médio.

**Valor de um negócio:** o da proposta com que foi ganho; se ainda não foi ganho, o da proposta mais recente; sem proposta, zero.

**O que mudou nos dados** (`sql/relatorios.sql`, a correr depois do `donos.sql`):

- **Etapa "perdido"**, a 5.ª do funil, com o vermelho que já existia no design. Marcar como perdido — no Funil ou na página do contato — abre uma janela que **obriga a escolher o motivo** de uma **lista fechada**: Preço, Escolheu concorrente, Sem orçamento, Sem resposta, Adiado, Não era o perfil, Outro. O banco recusa perdido sem motivo e motivos fora da lista. Texto livre daria "preço", "Preco" e "caro demais" como três motivos diferentes, e nada somava.
- **Origem** do contato, também de lista fechada: Site, Indicação, LinkedIn, Redes sociais, Evento, Prospeção ativa, Outro. Escolhe-se ao criar o contato e muda-se na ficha. Os contatos antigos ficam "Sem origem".
- **Fecho previsto** do negócio, na ficha do contato.
- **Histórico de etapas**, **data de ganho** e **data de perda** gravados pelo próprio banco (trigger) a cada mudança de etapa, venha ela de onde vier. O histórico começa na v8: o tempo que os contatos antigos já estavam na etapa atual não ficou registado, e os clientes ganhos antes da v8 não têm data de ganho (o relatório diz quantos são).
- **Metas** mensais, por utilizador.

O Funil passou a ter cinco colunas, mais estreitas, para caberem num ecrã normal sem rolar.

**PRONTO QUANDO**

- [ ] No Dashboard vejo os cinco relatórios por baixo do painel, com os filtros de período e origem por cima
- [ ] Mudo o período ou a origem, carrego em Aplicar, e os cinco relatórios mudam juntos
- [ ] Arrasto um contato para "perdido" no Funil e tenho de escolher o motivo; se cancelar, ele fica onde estava
- [ ] Gravo uma meta para este mês e o relatório de receita mostra a meta, o % atingido, o ritmo e a projeção
- [ ] Ponho origem e fecho previsto num contato e ele aparece no pipeline e no relatório de origem
- [ ] Exporto cada relatório e o Excel abre o ficheiro com os mesmos números do ecrã
- [ ] Com outra conta, os relatórios mostram só os números dessa conta

## Versão 9

### 1. Emails de aviso — CONCLUÍDO

O CRM passa a enviar emails, a partir de **crm@firstmedia.pt**, para avisar cada utilizador das suas tarefas e reuniões. Só envia avisos aos utilizadores do CRM — nunca escreve aos contatos.

**Três avisos:**

- **Resumo das tarefas**, todos os dias a partir das **8h** (Lisboa): as tarefas atrasadas e as de hoje. Só sai se houver alguma.
- **Reunião daqui a uma hora**: para o dono da reunião e para os utilizadores da equipa que participam.
- **Reunião marcada ou mudada**: quando uma reunião é marcada, ou muda de hora (incluindo arrastar no Calendário), os utilizadores participantes recebem os detalhes. O dono não recebe — foi ele que a marcou. As reuniões que já existiam antes da v9 não geram este aviso.

**Área Emails** (na navegação): cada utilizador escolhe o **email onde recebe** os avisos (por omissão, o da conta), liga ou desliga cada um dos três avisos, envia um **email de teste**, e vê o **histórico** dos emails que lhe foram enviados (até 50), com o estado — e o motivo, se falhou.

**Nunca há avisos duplicados.** Cada aviso tem uma chave única no banco (que aviso, para quem, de quando). Antes de enviar, o CRM grava a chave; se ela já existir, o email não sai outra vez — mesmo que o envio corra duas vezes ao mesmo tempo. Um envio que falha é tentado de novo, no máximo 3 vezes; um que fique preso "a enviar" mais de 15 minutos também.

**Como funciona por baixo:**

- O envio usa o **SMTP da caixa crm@firstmedia.pt**. As credenciais ficam só no `.env.local` da VPS: `SMTP_HOST`, `SMTP_PORT` (465), `SMTP_USER`, `SMTP_PASS`, e opcionalmente `EMAIL_REMETENTE` (o "De:") e `CRM_URL` (para os links nos emails).
- Na VPS, um **cron** chama `POST /emails/enviar` a cada 5 minutos. Esse endereço não usa sessão: exige o segredo `CRON_SEGREDO` (32+ caracteres, no `.env.local`), comparado em tempo constante.
- Ligações ao SMTP com limites de espera (15 s para ligar, 30 s sem resposta): um servidor de email lento nunca prende o envio.
- **Preparado para cada um usar o seu email:** o envio já aceita um remetente por mensagem. Ligar a caixa de cada utilizador é um passo seguinte, que não entra na v9.

Mudanças de banco em `sql/emails.sql`: preferências em `usuarios`, `reunioes.alterada_em` (gravado por trigger) e a tabela `emails_enviados`.

**PRONTO QUANDO**

- [ ] Na área Emails carrego em "Enviar email de teste" e o email chega, vindo de crm@firstmedia.pt
- [ ] Com tarefas atrasadas ou de hoje, recebo o resumo uma vez por dia, depois das 8h
- [ ] Recebo um aviso uma hora antes de uma reunião minha, e os participantes da equipa também
- [ ] Marco uma reunião com um colega como participante e ele recebe "Reunião marcada"; arrasto-a para outra hora e ele recebe "Reunião mudada"
- [ ] Desligo um aviso na área Emails e esse aviso deixa de chegar
- [ ] O histórico mostra cada email, e nenhum aparece em duplicado

## Versão 10

### 1. Hora nas tarefas — CONCLUÍDO

As tarefas passam a ter **hora e minutos**. Uma tarefa com dia **tem de ter hora**; sem dia, não tem hora. As tarefas criadas antes da v10 ficam sem hora até serem mudadas.

A hora é guardada como se lê num relógio de Lisboa ("14:30"), tal como o dia já era desde a v3: não há fuso para converter, e o que se escreve é o que se vê, esteja o computador onde estiver. O banco recusa hora sem dia.

- **Onde aparece:** na página do contato e na área Tarefas ("04/10, 14:30"), ordenadas por dia e hora; no resumo diário por email.
- **Calendário:** na semana e no dia, as tarefas com hora ficam na grelha das horas (meia hora cada), ao lado das reuniões. Arrastar na grelha muda o dia e a hora; arrastar no mês muda só o dia. Com o teclado, ↑ ↓ mudam a hora em passos de meia hora. As tarefas antigas, sem hora, continuam na linha "tarefas" do dia.
- **Repetir:** a tarefa seguinte nasce à mesma hora.
- **Aviso por email 1 hora antes** de cada tarefa com hora, só para o dono. Liga-se e desliga-se na área Emails ("Tarefa daqui a uma hora"), e, como os outros avisos, sai uma única vez.

Mudanças de banco em `sql/tarefas-hora.sql`: `tarefas.vence_hora`, `usuarios.aviso_tarefa_antes` e o tipo novo no registo de emails.

**PRONTO QUANDO**

- [ ] Crio uma tarefa com dia e o CRM obriga a escolher a hora
- [ ] A tarefa aparece com "dia, hora" na página do contato e na área Tarefas, pela ordem certa
- [ ] No Calendário (semana) a tarefa está na hora certa; arrasto-a para outra hora, recarrego, e continua lá
- [ ] Concluo uma tarefa que se repete e a seguinte fica à mesma hora
- [ ] Uma hora antes de uma tarefa recebo um email, uma vez só

## Versão 11

### 1. Segurança: RLS em todas as tabelas e Next.js atualizado — CONCLUÍDO

- **RLS em todas as tabelas.** As tabelas criadas no início (`usuarios`, `contatos`, `anotacoes`, `follow_ups`, `tarefas`) podiam estar sem proteção de linhas: quem tivesse a chave pública do Supabase (a "anon", que não é secreta por natureza) lia e escrevia nelas pela API — incluindo os hashes das senhas. `sql/seguranca.sql` liga o RLS em todas as tabelas, sem políticas: a chave pública deixa de ver ou mexer em qualquer coisa. O CRM não é afetado, porque usa a chave secreta, só no servidor. O SQL pode ser corrido mais de uma vez e termina a listar as tabelas ainda sem RLS (tem de vir vazio).
- **Next.js 16.3.8.** A versão anterior (16.3.4) tinha uma falha crítica conhecida (execução remota de código em `next/og`, que o CRM não usa). Depois da atualização, `npm audit` não encontra vulnerabilidades.

**Encontrado na revisão e deixado para depois, por decisão:** "Sair" não invalida uma sessão copiada (vale até 12 horas); o registo diz se um email já tem conta (o limite de contas à espera entrou na v16); "Gerar follow-up" não tem limite diário; Dashboard e Funil só contam os primeiros 1000 contatos (limite do Supabase por pedido).

**PRONTO QUANDO**

- [ ] O `sql/seguranca.sql` termina sem tabelas listadas
- [ ] Depois de atualizar a VPS, `npm ls next` mostra 16.3.8 e o CRM funciona como antes

## Versão 12

### 1. Esqueci-me da password — CONCLUÍDO

No ecrã de login há o link **"Esqueci-me da password"**. A pessoa escreve o email da conta e recebe, de crm@firstmedia.pt, um link para escolher uma password nova (duas vezes, mínimo 8 caracteres, com o botão Mostrar). Depois volta ao login com a mensagem "Password mudada".

**Segurança:**

- **Não revela que emails têm conta:** a resposta é sempre a mesma, exista a conta ou não, e o email sai em segundo plano para a demora também não o dizer. Só contas aprovadas recebem o link.
- **Link de uso único, válido 1 hora.** Do código do link só se guarda o hash: quem lesse a base de dados não conseguia usar nenhum link. Gastar o link e mudar a senha é uma operação só — o mesmo link não serve duas vezes.
- **O link aponta sempre para o `CRM_URL` do `.env`**, nunca para o endereço que vem no pedido: ninguém consegue fazer o email apontar para um site falso.
- **No máximo 3 pedidos por hora** por conta.
- **Ao mudar a password, todas as sessões abertas dessa conta deixam de valer** (também uma sessão copiada), e os outros links pendentes também. O bloqueio por tentativas erradas recomeça do zero.
- O email vai para o email da conta (o de login), não para o email de avisos.

Precisa de `CRM_URL` e do SMTP no `.env` (os mesmos dos emails de aviso). Sem eles, a página diz que a recuperação não está configurada.

Mudanças de banco em `sql/recuperar-senha.sql`: `usuarios.senha_alterada_em`, a tabela `recuperacoes_senha` e o tipo novo no registo de emails.

**PRONTO QUANDO**

- [ ] No login carrego em "Esqueci-me da password", escrevo o meu email e recebo o link
- [ ] Com um email que não existe, a mensagem é a mesma e não chega email nenhum
- [ ] Escolho a password nova, volto ao login e entro com ela; a antiga já não entra
- [ ] O mesmo link, aberto outra vez, diz que já foi usado
- [ ] Noutro browser onde tinha o CRM aberto, a sessão deixa de valer

## Versão 13

### 1. Tema claro — CONCLUÍDO

No canto superior direito, ao lado do email, há um botão **Claro / Escuro** (sol/lua). O mesmo botão está no canto superior direito do ecrã de login. Muda o CRM inteiro para o tema claro e de volta. O escuro continua a ser o padrão. A escolha fica guardada no browser (um cookie, durante um ano) e a página já abre no tema escolhido. Cores em `design.md`, secção "Tema claro". No telemóvel o botão mostra só o ícone. Sem mudanças de banco.

**PRONTO QUANDO**

- [ ] Carrego em "Claro" e o CRM fica claro em todas as áreas
- [ ] Recarrego a página ou fecho e volto a abrir o browser e continua claro
- [ ] Carrego em "Escuro" e volta ao tema escuro
- [ ] No ecrã de login também há o botão, e a escolha feita lá mantém-se depois de entrar

### 2. Título e descrição para o Google — CONCLUÍDO

A página pública tem (desde a v14 é a landing page; antes era o login):

- **Título:** Software CRM em Português | First Media CRM (antes: "CRM para PME em Portugal | First Media CRM")
- **Descrição:** Pipeline de vendas, contactos e tarefas num CRM simples e em português. Nunca mais perca um follow-up. Conheça o First Media CRM.

As páginas de dentro mantêm o seu próprio título ("Funil — First Media CRM", etc.).

O título e a descrição também vão nas etiquetas de partilha (Open Graph e Twitter: o que o Facebook, o LinkedIn e o WhatsApp mostram quando se partilha o link), com o logótipo como imagem. O endereço oficial (`canonical`) é `https://firstmediacrm.online` e a página diz ao Google que pode ser indexada. A língua do site está marcada como português de Portugal (`pt-PT`).

**Schema markup** (JSON-LD, os dados estruturados que o Google lê): a landing page descreve a First Media (organização), o site, o **First Media CRM como software** (categoria CRM, funciona no browser, funcionalidades e os dois preços, IVA incluído e com 14 dias grátis: 29,99 € por utilizador por mês e 287 € por utilizador por ano) e as **perguntas frequentes**. Só leva o que a página já mostra: sem avaliações nem números inventados.

**Para os bots do Google e das IAs:**

- `/robots.txt` — ficheiro fixo em `public/robots.txt` (desde a v16, com o texto dado): todos os bots podem ler tudo (`Allow: /`), e os das IAs (GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended) aparecem pelo nome. O CRM por dentro deixou de estar listado como fora, por decisão: continua protegido pelo login, os bots só veem o ecrã de entrada. O Sitemap aponta para `https://firstmediacrm.online/sitemap.xml`, o endereço oficial, sem www. Quem abre qualquer página por `www.firstmediacrm.online` é redirecionado (301) para a mesma página sem www (`proxy.js`).
- `/sitemap.xml` — a lista das páginas públicas.
- `/llms.txt` — um resumo do First Media CRM em texto simples, para as IAs: o que é, funcionalidades, preço, perguntas frequentes e contacto. Inclui os dois planos, mensal (29,99 €) e anual (287 €). Quando se muda a landing page, convém mudar também este ficheiro (`public/llms.txt`).

**PRONTO QUANDO**

- [ ] O separador do browser na página pública mostra "Software CRM em Português | First Media CRM"
- [ ] O código da página do login traz a descrição acima

## Versão 14

### 1. Landing page com formulário de leads — CONCLUÍDO

Quem abre `firstmediacrm.online` sem sessão vê a landing page, no mesmo endereço. Quem tem sessão continua a ir direto para o Dashboard; o login fica em `/login` (botão "Entrar" no topo da landing).

A página segue o funil de conversão, de cima para baixo:

1. **Atenção:** "Nunca mais perca um follow-up", com um funil de exemplo e o botão "Experimentar 14 dias grátis".
2. **Interesse:** as três dores (contactos espalhados, follow-ups esquecidos, vendas às escuras).
3. **Desejo:** as funcionalidades que o CRM já tem e os 3 passos para começar.
4. **Ação:** preço — **29,99 € por utilizador por mês, com 14 dias grátis**, e ao lado, à direita, o cartão anual: **287 € por utilizador por ano**, 20% de desconto face ao mensal —, perguntas frequentes e o formulário.

   Logo abaixo do preço, a secção **"O que dizem os nossos clientes"**: um slideshow com 6 testemunhos reais, autorizados pelos próprios, com o nome de cada um (sem profissão nem empresa). Mostra um de cada vez, passa sozinho a cada 5 segundos. Fica parado enquanto a pessoa o usa (rato a mexer por cima, toque, teclas, setas) e volta ao automático 5 segundos depois de ela parar, ou logo que o rato saia da secção. Se o sistema pedir menos animação, nunca passa sozinho. Setas, pontos, teclas ← → e deslizar no telemóvel. Os 6 textos estão no HTML, para as IAs e o Google os lerem. Ficam fora dos dados estruturados: o Google não aceita avaliações publicadas pela própria empresa.

Cores e logótipo da First Media (ver `design.md`, "Landing page").

**Formulário:** nome, email, telefone (obrigatório na v14.2, opcional desde a v16), empresa (opcional desde a v14.2), mensagem (opcional) e a caixa obrigatória de consentimento (RGPD). Cada pedido fica guardado na tabela `leads` e sai um email de aviso de crm@firstmedia.pt para cada administrador (para o email de avisos, se tiver um). Contra abusos: um campo escondido que só robôs preenchem, e no máximo 10 pedidos por dia do mesmo email (eram 3 até à v16). Desde a v16, também no máximo 20 pedidos por dia a partir da mesma ligação (IP), com quaisquer emails. Passado o limite, o formulário diz que já recebemos vários pedidos com aquele email hoje, em vez de fingir que enviou. O campo "Quantos utilizadores?" saiu na v16 (`sql/leads-utilizadores-opcional.sql`). O botão diz **"Quero os 14 dias grátis já"**. Desde a v16, mal o pedido é enviado, a página segue para **Criar conta** (`/registo`) com nome, email e telefone já preenchidos (o telefone separado em indicativo e número); falta só a senha. Os dados passam pela memória do separador (sessionStorage) e apagam-se ao serem usados: não vão no endereço, para não ficarem no histórico nem no Google Analytics.

Mudanças de banco em `sql/leads.sql`.

**PRONTO QUANDO**

- [ ] Abro `firstmediacrm.online` numa janela privada e vejo a landing page
- [ ] "Entrar" leva ao login; com sessão, o endereço abre o Dashboard
- [ ] Preencho o formulário e vejo "Pedido recebido. Obrigado!"
- [ ] Recebo o email "Lead novo" e o pedido aparece na tabela `leads` do Supabase

### 2. IVA, política de privacidade e campos obrigatórios — CONCLUÍDO

- O preço diz **"IVA incluído"** (no topo, no cartão do preço e nas perguntas).
- Página **Política de privacidade** em `/privacidade`, com o aspeto da landing page: quem trata os dados, que dados, para quê, quanto tempo (24 meses depois do último contacto), com quem se partilham, cookies (só os essenciais), direitos e queixa à CNPD. Ligada na caixa do consentimento (abre noutro separador, para não perder o que já se escreveu) e no rodapé.
- No formulário, os campos obrigatórios têm asterisco: **Nome, Email, Telefone**, número de utilizadores e a caixa do consentimento. O telefone passou a ser obrigatório. A **Empresa é opcional** (`sql/leads-empresa-opcional.sql`).

Mudança de banco: `sql/leads-empresa-opcional.sql`.

**PRONTO QUANDO**

- [ ] O preço mostra "IVA incluído"
- [ ] O link "política de privacidade" no formulário abre a página noutro separador
- [ ] Sem telefone, o formulário não é enviado (deixou de valer na v16: o telefone voltou a ser opcional)
- [ ] Sem empresa, o formulário é enviado

## Versão 15

### 1. Backend: email SMTP de cada utilizador (primeira parte) — CONCLUÍDO

Área nova **Backend** na barra lateral, a penúltima (antes de Usuários; para quem não é admin, é a última). Todos os utilizadores a veem, cada um só com a sua configuração.

Cada pessoa configura a caixa de email de onde, mais tarde, vão sair os emails que enviar pelo CRM: **nome e email do remetente, servidor SMTP, porta (465 SSL/TLS, 587, 25 ou 2525 com STARTTLS), utilizador e password**. Há um botão **"Enviar email de teste"**, que envia pela caixa configurada para o email da conta e mostra se correu bem ou o motivo da falha, em português. Também se pode apagar a configuração.

Nesta primeira parte é **só configurar e testar**: nenhum email passa ainda a sair da caixa de cada pessoa. Os emails do sistema — avisos de tarefas e reuniões, leads para o administrador, recuperação de password — continuam a sair de crm@firstmedia.pt, sem mudanças.

**Segurança:**

- A password SMTP fica **cifrada** (AES-256-GCM) com a chave `SMTP_CHAVE` do `.env` da VPS. Quem lesse a base de dados só via texto ilegível. A password nunca volta ao ecrã: para a mudar, escreve-se uma nova; vazia, mantém a guardada.
- O servidor SMTP tem de ser da internet: endereços internos (a própria VPS, rede local) são recusados, para ninguém usar o CRM para espreitar serviços internos.
- Um teste de cada vez, com 20 segundos entre testes.

Mudanças de banco em `sql/smtp-utilizadores.sql`. Precisa de `SMTP_CHAVE` no `.env` (gerada com `openssl rand -hex 32`).

**PRONTO QUANDO**

- [ ] Vejo "Backend" na barra lateral, antes de "Usuários"
- [ ] Preencho a configuração da minha caixa, guardo, e o email de teste chega à minha caixa de entrada
- [ ] Com a password errada, o teste diz "O servidor recusou o utilizador ou a password"
- [ ] Outro utilizador não vê a minha configuração

## Versão 16

### 1. Nome e telefone no registo — CONCLUÍDO

Quem cria conta escreve agora **Nome, Email e Telefone**, os três obrigatórios, além da senha. O telefone usa o mesmo seletor de indicativo dos contatos e fica no formato internacional (`+351 912345678`); Portugal exige 9 dígitos. As contas que já existiam ficam sem nome e sem telefone. Na área **Usuários**, o administrador vê o nome e o telefone por baixo do email de cada conta, à espera ou com acesso.

Cada conta nova envia um email de aviso de crm@firstmedia.pt a cada administrador (para o email de avisos, se tiver um), com o nome, o email e o telefone de quem se registou e o link para a área Usuários. Sai uma vez só por conta, e fica na lista de emails enviados da área Emails como "Conta nova".

Quando o registo fica concluído (conta criada), a página de registo mostra o pop-up "Entraremos em contacto muito brevemente", nas cores da landing page (exceção registada no `design.md`). Só aparece depois de a conta ficar gravada: com um erro no formulário, não aparece. Ao fechar ("Fechar", X ou Esc), segue para o login.

O campo da senha do registo tem o botão "Mostrar"/"Ocultar", igual ao do login, para ver o que se escreveu.

Contra abusos no registo: um campo escondido que só robôs preenchem (o robô vê o pop-up de sucesso, mas nada é gravado) e no máximo 10 contas novas por hora, de toda a gente junta; passado o limite, o formulário pede para tentar daqui a uma hora e não sai aviso ao administrador. A política de privacidade passou a dizer que da conta se guardam também o nome e o telefone.

**Limites por ligação (IP).** O travão do login deixou de deixar que qualquer pessoa bloqueie o administrador: 5 senhas erradas bloqueiam durante 15 minutos só aquele email **naquela ligação**, e o administrador, noutra ligação, continua a entrar. Além disso, 20 senhas erradas a partir da mesma ligação, em quaisquer emails, bloqueiam essa ligação durante 15 minutos. No formulário da landing page, a mesma ligação envia no máximo 20 pedidos por dia, com quaisquer emails. O IP nunca fica guardado: só um hash dele, na tabela `limites` (`sql/limites.sql`). O IP vem do cabeçalho `X-Real-IP` que o nginx da VPS põe (`proxy_set_header X-Real-IP $remote_addr;`); sem ele, os limites por ligação ficam desligados e o login volta a contar só por email.

Os contadores da tabela `limites` com mais de 2 dias, e que não estejam bloqueados nesse momento, são apagados automaticamente pelo cron dos avisos (`/emails/enviar`, a cada 5 minutos). A política de privacidade diz que se guarda esse código derivado do IP, e que é apagado ao fim de 2 dias no máximo.

**Google Analytics** (`G-XBHF60CQXZ`) em todas as páginas, incluindo o CRM por dentro, logo a abrir o `<head>` (`app/layout.js`). Os scripts levam o nonce da CSP, e a CSP (`proxy.js`) passou a deixar o navegador falar com o Google Analytics. Só carrega para quem aceitou os cookies de estatística.

**Aviso de cookies** na landing page (`app/aviso-cookies.js`). Na primeira visita aparece uma faixa em baixo, com "Aceitar", "Recusar" (o mesmo tamanho e peso, como pede a CNPD) e "Personalizar". "Personalizar" e a ligação "Gerir cookies" do rodapé abrem as preferências: Essenciais (sempre ativos) e Estatísticas (Google Analytics), com interruptor, e os botões "Recusar todos", "Guardar preferências" e "Aceitar todos". A escolha fica 6 meses no cookie `consentimento_cookies`. Aceitar carrega o Google Analytics logo, sem recarregar. Retirar a autorização apaga os cookies `_ga` e recarrega a página. Sem escolha, o Google Analytics não carrega em página nenhuma, nem no CRM. A política de privacidade explica isto.

No canto superior esquerdo do login e do registo há um "← Voltar": no login leva à página inicial, no registo leva ao login.

Quem cria conta recebe logo um email "Recebemos o seu registo no First Media CRM": obrigado, a conta está à espera de aprovação, "Entraremos em contacto muito brevemente" (a frase do pop-up), e que recebe outro email quando for aprovada. Sai uma vez por conta (`sql/aviso-registo-recebido.sql`).

Quando o administrador aprova uma conta, sai um email de crm@firstmedia.pt para essa pessoa: "Obrigado, a sua conta do First Media CRM foi ativada, desfrute!", com o link para entrar. Sai uma vez por aprovação; uma conta a quem se tirou o acesso e que volta a ser aprovada recebe-o de novo.

Mudanças de banco: `sql/usuarios-nome-telefone.sql` (colunas `usuarios.nome` e `usuarios.telefone`), `sql/aviso-registo.sql`, `sql/aviso-aprovado.sql` e `sql/aviso-registo-recebido.sql` (os tipos novos no registo de emails).

**PRONTO QUANDO**

- [ ] Em "Criar conta" vejo Nome, Email, Telefone (com indicativo) e Senha
- [ ] Sem nome ou sem telefone, a conta não é criada
- [ ] Com um telefone português de 8 dígitos, aparece o aviso e a conta não é criada
- [ ] Com tudo certo, a conta fica à espera de aprovação e, no Supabase, a linha em `usuarios` tem o nome e o telefone
- [ ] Na área Usuários vejo o nome e o telefone da conta nova por baixo do email
- [ ] Quando alguém cria conta, recebo no email de administrador o aviso "Conta nova" com o nome, o email e o telefone
- [ ] Só depois de criar a conta aparece o pop-up "Entraremos em contacto muito brevemente"; ao abrir o registo ou com um erro no formulário, não aparece; ao fechá-lo, vou para o login
- [ ] Aprovo uma conta e a pessoa recebe o email "Obrigado, a sua conta do First Media CRM foi ativada, desfrute!"

### O que fica para depois

- Permissões avançadas: partilhar contatos entre utilizadores; relatórios da equipa por responsável
- Automações e lembretes por WhatsApp; emails para os contatos, a sair da caixa de cada utilizador (a configuração dessa caixa entrou na v15; os avisos por email aos utilizadores entraram na v9)
- Integrações com outros sistemas
- Aplicativo de celular

## O que NÃO entra na primeira versão

- Times: desde a v6 cada utilizador só vê os seus contatos; não há equipas nem contatos partilhados
- Importação de contatos (CSV, planilha, contatos do celular). A exportação para .xlsx entrou na v7.
- Envio de e-mail aos contatos, ou WhatsApp, pelo sistema (os avisos por email aos utilizadores entraram na v9)
- Integrações com outras ferramentas
- Campos personalizados e etapas de funil configuráveis (a v8 acrescentou campos e a etapa "perdido", fixos)
- Histórico de alterações e auditoria (só as mudanças de etapa ficam registadas, desde a v8)
- Aplicativo para celular (a web responsiva resolve)
- Comissões e relatórios configuráveis (os cinco relatórios fixos e as metas mensais entraram na v8)
- Cobrança, planos e assinaturas
- Lembretes automáticos (as tarefas entraram na v3 e o calendário com reuniões na v5; lembretes continuam fora — o CRM não envia convites nem avisos de reunião)
- Anexos e arquivos por contato, além das propostas (que entraram na v4)
