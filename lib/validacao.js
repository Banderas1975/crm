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
