// Limites e verificações usados antes de gravar seja o que for.
// O navegador também trava (maxLength, type="email"), mas isso é só conforto:
// quem manda o pedido por fora do formulário passa por aqui na mesma.

export const LIMITES = {
  nome: 120,
  email: 200,
  anotacao: 5000,
  senha: 200,
  tarefa: 200,
};

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailValido = (email) => FORMATO_EMAIL.test(email);

// Datas chegam do <input type="date"> como "2026-09-23". O Date.parse recusa
// dias que não existem (um "2026-02-31" não passa), por isso não basta o formato.
const FORMATO_DIA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export const dataValida = (texto) =>
  FORMATO_DIA_ISO.test(texto) && !Number.isNaN(Date.parse(`${texto}T00:00:00Z`));

// Os ids chegam sempre de fora: campo escondido do formulário, endereço da
// página, ou argumento de uma action. Só um inteiro positivo é id de verdade —
// um "1.5" ou um número gigante iria parar ao banco e rebentar lá dentro.
export const idValido = (valor) => Number.isInteger(valor) && valor > 0;

// ---- propostas ----

// 4,5 MB. O bucket no Supabase tem o mesmo teto, como segunda barreira.
export const TAMANHO_MAX_PROPOSTA = 4.5 * 1024 * 1024;

// Só estes três. O tipo servido ao navegador sai daqui, nunca do que o
// navegador disse no envio — esse valor é escrito por quem envia.
export const TIPOS_PROPOSTA = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Devolve "pdf", "docx" ou "xlsx", ou null se o ficheiro não é o que diz ser.
// A extensão não basta: um .pdf renomeado de .html ou .exe passava. Por isso
// olhamos também para os primeiros bytes. Um PDF começa por "%PDF-"; um DOCX e
// um XLSX são arquivos ZIP ("PK") com uma pasta word/ ou xl/ lá dentro — e os
// nomes das pastas ficam por comprimir, dá para os encontrar no próprio ficheiro.
export function tipoDaProposta(nome, bytes) {
  const extensao = (nome.split(".").pop() || "").toLowerCase();
  const inicio = bytes.subarray(0, 5).toString("latin1");

  if (extensao === "pdf") return inicio === "%PDF-" ? "pdf" : null;

  if (!inicio.startsWith("PK\x03\x04")) return null;
  if (extensao === "docx") return bytes.includes("word/document.xml") ? "docx" : null;
  if (extensao === "xlsx") return bytes.includes("xl/workbook.xml") ? "xlsx" : null;
  return null;
}

// Valor em euros, escrito como em Portugal: "12500", "12500,50", "12.500,50".
// Um ponto seguido de três dígitos é separador de milhares ("12.500" = 12500).
// Devolve o número, ou null. O teto é o que cabe na coluna numeric(12,2).
export function lerValor(texto) {
  let limpo = (texto || "").replace(/\s/g, "");
  if (limpo.includes(",") || /^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  }
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(limpo)) return null;
  const valor = Number(limpo);
  return valor > 0 ? valor : null;
}
