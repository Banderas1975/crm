// Consentimento de cookies, partilhado entre o servidor (app/layout.js decide
// que etiquetas da Google carrega) e o aviso de cookies da landing page.
export const GA_ID = "G-XBHF60CQXZ"; // Google Analytics: estatísticas
export const ADS_ID = "AW-17945715732"; // Google Ads: publicidade

// Guarda a escolha da pessoa, por categoria: "v2.estatisticas.publicidade",
// "v2.estatisticas", "v2.publicidade" ou "v2.essenciais" (recusou tudo).
// Sem o cookie, ou com o formato antigo (de antes de haver a categoria
// Publicidade), ainda não escolheu: o aviso volta a aparecer e nada carrega.
export const COOKIE_CONSENTIMENTO = "consentimento_cookies";
export const VALIDADE_CONSENTIMENTO = 182 * 24 * 60 * 60; // 6 meses, em segundos

export function lerConsentimento(valor) {
  const partes = (valor ?? "").split(".");
  if (partes[0] !== "v2") return null;
  return { estatisticas: partes.includes("estatisticas"), publicidade: partes.includes("publicidade") };
}

export function escreverConsentimento({ estatisticas, publicidade }) {
  const aceites = [estatisticas && "estatisticas", publicidade && "publicidade"].filter(Boolean);
  return ["v2", ...(aceites.length ? aceites : ["essenciais"])].join(".");
}

// As etiquetas a carregar para uma escolha: a primeira dá o nome ao gtag.js.
export function etiquetas({ estatisticas, publicidade }) {
  return [estatisticas && GA_ID, publicidade && ADS_ID].filter(Boolean);
}
