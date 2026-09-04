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

## Fora da v2 (fica pra v3)

- Permissões avançadas: dono por contato, metas por usuário
- Automações e lembretes agendados
- Integrações com outros sistemas
- Aplicativo de celular

## O que NÃO entra na primeira versão

- Times: todos os usuários aprovados veem os mesmos contatos, sem divisão por dono ou equipe
- Importação/exportação (CSV, planilha, contatos do celular)
- Envio de e-mail ou WhatsApp pelo sistema
- Integrações com outras ferramentas
- Campos personalizados e etapas de funil configuráveis
- Histórico de alterações e auditoria
- Aplicativo para celular (a web responsiva resolve)
- Relatórios avançados, metas e comissões
- Cobrança, planos e assinaturas
- Agenda, tarefas e lembretes automáticos
- Anexos e arquivos por contato
