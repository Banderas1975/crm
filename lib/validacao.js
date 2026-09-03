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
