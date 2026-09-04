# Identidade visual — CRM (v2 · Dark Tech)

Estas regras valem para **todas** as telas do projeto, sem exceção: login, criar conta,
dashboard, funil, contatos e usuários. Se uma tela não seguir isto, está errada.

## Clima

Ferramenta técnica e precisa, escura, de quem trabalha à noite.
Um produto profissional, não um template.

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
│              │  Meu CRM        email@pessoa.com   Sair  │  ← cabeçalho
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
  **Dashboard**, **Funil**, **Contatos** e **Usuários** (este só aparece para admin).
  A lista é feita para crescer: itens novos entram na mesma coluna.
- **Cabeçalho** no topo da área de conteúdo, com o nome do CRM, quem está logado
  e o botão **Sair**.
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
| Dashboard | `/` | O painel com os números do funil |
| Funil | `/funil` | A lista de contatos: etapa, anotações e follow-up |
| Contatos | `/contatos` | O cadastro de um contato novo |
| Usuários | `/usuarios` | Quem pode entrar (só admin) |

## Proibido

- Gradientes
- Efeito de vidro / desfoque
- Emojis na interface
- Sombras exageradas
- Animações chamativas
- Qualquer cor de marca além do azul elétrico

Se parecer template de IA, está errado.
