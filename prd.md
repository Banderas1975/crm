# PRD — CRM

## O que é e pra quem

Um CRM simples para organizar contatos e oportunidades de negócio em um só lugar. É para quem vende sozinho ou em time pequeno e hoje controla tudo em planilha, caderno ou na memória. O objetivo é saber, a qualquer momento, com quem falar e em que pé está cada negociação.

## Funcionalidades da primeira versão

- [x] Cadastro e listagem de contatos
- [x] Telefone com indicativo de país — seletor com todos os países, número guardado no formato internacional (`+351 912345678`); Portugal exige exatamente 9 dígitos, os outros países aceitam de 4 a 15 no total
- [x] Funil com etapas: novo, em contato, proposta, cliente
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
- **Nunca há avisos duplicados.** O único aviso é o contador ao lado de "Tarefas" na navegação, com as atrasadas mais as de hoje. É contado no banco a cada visita e não fica guardado — não há estado que possa duplicar. O CRM continua a não enviar email nem WhatsApp.
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

- **Até 4,5 MB por proposta.** Conferido no navegador (para avisar antes de enviar), na action e no próprio bucket do Supabase.
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
- **Travão no login.** 5 senhas erradas seguidas para o mesmo email bloqueiam esse email durante 15 minutos. Enquanto está bloqueado, nem a senha certa entra. Conta por email, exista a conta ou não, para o bloqueio não revelar que emails estão registados. A senha certa recomeça a contagem.

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

### O que fica para depois

- Permissões avançadas: partilhar contatos entre utilizadores, metas por usuário
- Automações e lembretes agendados (email, WhatsApp)
- Integrações com outros sistemas
- Aplicativo de celular

## O que NÃO entra na primeira versão

- Times: desde a v6 cada utilizador só vê os seus contatos; não há equipas nem contatos partilhados
- Importação/exportação (CSV, planilha, contatos do celular)
- Envio de e-mail ou WhatsApp pelo sistema
- Integrações com outras ferramentas
- Campos personalizados e etapas de funil configuráveis
- Histórico de alterações e auditoria
- Aplicativo para celular (a web responsiva resolve)
- Relatórios avançados, metas e comissões
- Cobrança, planos e assinaturas
- Lembretes automáticos (as tarefas entraram na v3 e o calendário com reuniões na v5; lembretes continuam fora — o CRM não envia convites nem avisos de reunião)
- Anexos e arquivos por contato, além das propostas (que entraram na v4)
