// Consentimento de cookies, partilhado entre o servidor (app/layout.js decide
// se carrega o Google Analytics) e o aviso de cookies da landing page.
export const GA_ID = "G-XBHF60CQXZ";

// Guarda a escolha da pessoa: "estatisticas" (aceitou) ou "essenciais" (recusou).
// Sem o cookie, ainda não escolheu: o Google Analytics não carrega.
export const COOKIE_CONSENTIMENTO = "consentimento_cookies";
export const VALIDADE_CONSENTIMENTO = 182 * 24 * 60 * 60; // 6 meses, em segundos
