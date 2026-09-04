// Limites e verificações usados antes de gravar seja o que for.
// O navegador também trava (maxLength, type="email"), mas isso é só conforto:
// quem manda o pedido por fora do formulário passa por aqui na mesma.

export const LIMITES = {
  nome: 120,
  email: 200,
  anotacao: 5000,
  senha: 200,
};

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailValido = (email) => FORMATO_EMAIL.test(email);

// Os ids chegam sempre de fora: campo escondido do formulário, endereço da
// página, ou argumento de uma action. Só um inteiro positivo é id de verdade —
// um "1.5" ou um número gigante iria parar ao banco e rebentar lá dentro.
export const idValido = (valor) => Number.isInteger(valor) && valor > 0;
