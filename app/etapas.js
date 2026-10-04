// Ordem do funil, do primeiro contacto ao negócio fechado. "perdido" fica no
// fim: é uma saída do funil, não um passo dele.
export const ETAPAS = ["novo", "em contato", "proposta", "cliente", "perdido"];

// As etapas que um negócio percorre para ser ganho, por ordem (sem "perdido").
export const ETAPAS_FUNIL = ["novo", "em contato", "proposta", "cliente"];

// Negócios ainda em aberto: nem ganhos nem perdidos.
export const ETAPAS_ABERTAS = ["novo", "em contato", "proposta"];

export const CORES_ETAPA = {
  novo: "var(--etapa-novo)",
  "em contato": "var(--etapa-em-contato)",
  proposta: "var(--etapa-proposta)",
  cliente: "var(--etapa-cliente)",
  perdido: "var(--etapa-perdido)",
};

// Probabilidade de fechar, usada no pipeline ponderado. Fixa por etapa.
export const PROBABILIDADE = { novo: 0.1, "em contato": 0.25, proposta: 0.5, cliente: 1, perdido: 0 };

// Listas fechadas: o banco recusa qualquer outro valor (ver sql/relatorios.sql).
// Texto livre dava "preço", "Preco", "caro demais"… e o relatório não somava nada.
export const ORIGENS = ["Site", "Indicação", "LinkedIn", "Redes sociais", "Evento", "Prospeção ativa", "Outro"];

export const MOTIVOS_PERDA = [
  "Preço",
  "Escolheu concorrente",
  "Sem orçamento",
  "Sem resposta",
  "Adiado",
  "Não era o perfil",
  "Outro",
];
