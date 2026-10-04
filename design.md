# Identidade visual — CRM (v2 · Dark Tech)

Estas regras valem para **todas** as telas do projeto, sem exceção: login, criar conta,
dashboard, funil, contatos e usuários. Se uma tela não seguir isto, está errada.

## Clima

Ferramenta técnica e precisa, escura, de quem trabalha à noite.
Um produto profissional, não um template.

O escuro é o tema padrão. Quem preferir pode mudar para o **tema claro** no botão
do cabeçalho (ver "Tema claro" mais abaixo).

## Cores

### Base

| Uso | Cor |
| --- | --- |
| Fundo da página (quase-preto azulado) | `#0D1117` |
| Superfícies (cards, barras, campos) | `#151B24` |
| Superfícies elevadas (modais, menus, itens dentro de um card) | `#1B222E` |
| Borda visível | `#262F3D` |
| Texto principal | `#E6EAF2` |
| Texto de apoio | `#94A0B8` |

### Destaque

Uma única cor de destaque, para ações e elementos ativos: **azul elétrico**.
**Nenhuma outra cor de marca.**

| Uso | Cor |
| --- | --- |
| Destaque | `#4D8DFF` |
| Destaque em hover (mais claro) | `#6BA1FF` |

### Etapas do funil

Versões luminosas, legíveis no escuro. Usadas **só** nas etiquetas e nos números
de etapa, em nenhum outro lugar:

| Etapa | Cor |
| --- | --- |
| novo | `#8B99AD` |
| em contato | `#F5A524` |
| proposta | `#A78BFA` |
| cliente | `#34D399` |
| perdido | `#F87171` (o mesmo vermelho de erro: não é uma cor nova) |

### Erro

| Uso | Cor |
| --- | --- |
| Erro | `#F87171` |

Contraste sempre confortável de ler. Se um texto exige esforço para ler, está errado.

## Tipografia

- **Manrope** (Google Fonts) em tudo.
- **JetBrains Mono** (Google Fonts) nos **números, contadores e etiquetas técnicas**:
  os números do painel, a contagem de anotações, as etiquetas de etapa do funil,
  as etiquetas de papel (administrador / usuário), datas e emails em listas.
  É o toque tech — não usar em textos corridos, títulos ou botões.
- Títulos em peso forte (700/800), textos em peso normal (400/500).
- Etiquetas técnicas em maiúsculas pequenas com espaçamento de letra aberto.
- Tamanhos generosos e hierarquia clara: cada nível de título é visivelmente
  diferente do anterior.

## Formas e espaço

- Cantos arredondados: **10px**.
- **Bordas visíveis** (`#262F3D`) em vez de sombras.
- Bastante respiro entre os elementos.

## Estrutura: de página para sistema

O CRM não é uma página comprida. É um **sistema com áreas**, dentro de um shell fixo.

### Shell de aplicação

```
┌──────────────┬──────────────────────────────────────────┐
│              │  First Media CRM  email@pessoa.com  Sair │  ← cabeçalho
│  Dashboard   ├──────────────────────────────────────────┤
│  Funil       │                                          │
│  Contatos    │           área de conteúdo               │
│  Usuários    │           (uma tela cheia)               │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
   navegação
    lateral
```

- **Navegação lateral fixa à esquerda**, sempre visível, com as áreas do sistema:
  **Dashboard**, **Funil**, **Tarefas**, **Calendário**, **Contatos**, **Emails**, **Backend** e **Usuários** (este só aparece para admin; o Backend é o penúltimo).
  A lista é feita para crescer: itens novos entram na mesma coluna.
- **Cabeçalho** no topo da área de conteúdo, com o nome do CRM, o botão do tema
  (sol/lua, "Claro"/"Escuro"), quem está logado e o botão **Sair**.
- **Área de conteúdo à direita**: cada área é uma tela cheia, com o seu próprio
  título e o seu próprio conteúdo. Nada de empilhar áreas diferentes na mesma página.
- **O item ativo da navegação** é destacado com a cor de destaque (`#4D8DFF`):
  texto na cor de destaque, fundo da superfície elevada e uma barra fina à esquerda.

### Telas estreitas

Abaixo de 860px a navegação lateral **se recolhe**: passa a ser uma faixa horizontal
no topo, com os mesmos itens lado a lado, rolável se não couberem. Sem menu escondido,
sem botão de hambúrguer — os itens continuam todos à vista e clicáveis.

### Telas de entrada

Login e criar conta **não têm shell**: são um cartão centrado sobre o fundo escuro,
com a mesma identidade (mesmas cores, mesmas formas, mesma tipografia).

## As áreas

| Área | Caminho | O que mostra |
| --- | --- | --- |
| Dashboard | `/` | O painel com os números do funil e, por baixo, os cinco relatórios |
| Funil | `/funil` | A lista de contatos: etapa, anotações e follow-up |
| Calendário | `/calendario` | Tarefas e reuniões por mês, semana ou dia, arrastáveis |
| Contatos | `/contatos` | O cadastro de um contato novo |
| Emails | `/emails` | Preferências dos avisos por email e histórico do que foi enviado |
| Usuários | `/usuarios` | Quem pode entrar (só admin) |

### Calendário

- Reuniões com uma barra fina à esquerda na cor de destaque; tarefas neutras, com o
  quadrado de tarefa. Nenhuma cor nova.
- Horas e números de dia em JetBrains Mono.
- O dia de hoje com o número na cor de destaque.
- Em telas estreitas o calendário rola para o lado **por dentro da sua caixa**; a página não.

### Relatórios

- Filtros numa linha, por cima dos relatórios; cada relatório num cartão, com o
  botão **Exportar .xlsx** no canto.
- Gráficos de barras finas, em HTML e CSS, sem biblioteca. Etapas na cor da etapa;
  tudo o resto no azul de destaque. A meta é um traço fino sobre a barra da receita.
- O número vai sempre em texto ao lado da barra, em JetBrains Mono: a cor nunca é
  a única forma de ler um valor.
- Tabelas rolam para o lado por dentro do cartão; a página não.
- O botão do tema mostra só o ícone (sol/lua), para o cabeçalho caber.

### Tema claro

Opção de cada pessoa, no canto superior direito (no cabeçalho do sistema e também
no ecrã de login). Mesmas regras, mesma estrutura, mesmo
azul — só trocam as cores de base. A escolha fica guardada no browser e a página já
abre no tema certo, sem piscar.

| Uso | Cor |
| --- | --- |
| Fundo | `#F4F6FA` |
| Superfície | `#FFFFFF` |
| Superfície elevada | `#EEF2F7` |
| Borda | `#D5DCE6` |
| Texto | `#0F172A` |
| Texto de apoio | `#4B5870` |
| Destaque / hover | `#2563EB` / `#1D4ED8` |
| Etapas: novo · em contato · proposta · cliente · perdido | `#5B6B82` · `#9A4A07` · `#7C3AED` · `#047857` · `#B91C1C` |
| Erro | `#B91C1C` |

As cores das etapas são versões mais escuras das do tema escuro, para continuarem
legíveis em fundo branco (contraste de pelo menos 4,5:1).

### Emails enviados

Os emails de aviso não usam o tema escuro: são texto simples num fundo claro, com
um título, as linhas do aviso e um link "Abrir no CRM". Programas de email
tratam mal fundos escuros e fontes externas — o que importa é ler-se em todo o lado.

### Landing page

A página pública (`firstmediacrm.online` sem sessão) é a **única exceção** às cores
acima: usa as cores do logótipo da First Media, para a marca se reconhecer. O CRM
por dentro não muda.

| Uso | Cor |
| --- | --- |
| Fundo | `#0E1020` (azul-noite) |
| Superfície / elevada | `#161A30` / `#1D2240` |
| Borda | `#2A3052` |
| Texto / apoio | `#EEF0FA` / `#A9AFCF` |
| Laranja do logótipo (botões, destaques) | `#F15A24`, hover `#FF7A4D` |
| Lilás do logótipo (links, palavras em destaque) | `#A4ACE9` |

- Os botões laranja levam **texto escuro** (`#0E1020`): branco sobre este laranja não
  chega ao contraste mínimo.
- Mesmas fontes, mesmas formas, mesmo "proibido" de baixo (sem gradientes, sem emojis).
- Logótipo em `public/logo-first-media.png`, no topo à esquerda.

## Proibido

- Gradientes
- Efeito de vidro / desfoque
- Emojis na interface
- Sombras exageradas
- Animações chamativas
- Qualquer cor de marca além do azul elétrico (exceto na landing page, ver acima)

Se parecer template de IA, está errado.
