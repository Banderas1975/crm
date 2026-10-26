// Consentimento de cookies, partilhado entre o servidor (app/layout.js decide
// que etiquetas da Google carrega) e o aviso de cookies da landing page.
export const GA_ID = "G-XBHF60CQXZ"; // Google Analytics: estatísticas
// Google Ads: publicidade. A conta certa é esta, a mesma da conversão.
export const ADS_IDS = ["AW-17954366291"];

// Conversão "CRM 2" do Google Ads: um pedido dos 14 dias grátis enviado com
// sucesso. O código é o que o Google Ads deu, tal e qual; vai no <head>, logo
// a seguir à etiqueta Google, só para quem aceitou os cookies de publicidade.
// Quem o chama é app/form-lead.js.
export const CONVERSAO_ENVIO = "AW-17954366291/5xHUCIiHrp4dENPGp_FC";
export const CONVERSAO_SNIPPET = `
function gtag_report_conversion(url) {
  var callback = function () {
    if (typeof(url) != 'undefined') {
      window.location = url;
    }
  };
  gtag('event', 'conversion', {
      'send_to': '${CONVERSAO_ENVIO}',
      'event_callback': callback
  });
  return false;
}
`;

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
  return [estatisticas && GA_ID, ...(publicidade ? ADS_IDS : [])].filter(Boolean);
}

// OffConversion: medição de conversões e dos formulários. Só nas páginas
// públicas sem passwords (landing page e política de privacidade) e só para
// quem aceitou a Publicidade. Ver app/offconversion.js.
export const OFFCONVERSION = {
  src: "https://api.offconversion.com/v1/p",
  id: "pk_live_kg-HC7HywyHjCxa6NKWbKxdwuP__QS-Q",
};
