import { NextResponse } from "next/server";
import { NOME_COOKIE, sessaoValida } from "./lib/sessao";

// As únicas páginas que se veem sem sessão. /inicio é a landing page (quem abre
// "/" sem sessão vê-a no mesmo endereço). /emails/enviar é o cron da VPS:
// não tem sessão, mas exige o segredo CRON_SEGREDO (verificado lá dentro).
// /recuperar/<código> é o link do email de recuperação de senha. Os ícones
// (favicon) também têm de se ver sem sessão, no separador do browser, e o
// robots.txt, o sitemap.xml e o llms.txt são para os bots do Google e das IAs.
// googled…html é o ficheiro de verificação do Google Search Console.
const PUBLICAS = new Set(["/inicio", "/privacidade", "/logo-first-media.png", "/icon.png", "/apple-icon.png", "/robots.txt", "/sitemap.xml", "/llms.txt", "/googled97d09f6bd753b4a.html", "/login", "/registo", "/recuperar", "/emails/enviar"]);
const PUBLICAS_PREFIXO = ["/recuperar/"];

// Regras de conteúdo (CSP): o navegador só corre scripts do próprio CRM que
// tragam o código (nonce) deste pedido. Um script injetado — num nome de
// contato, numa anotação — não tem o código e não corre. O Next põe o nonce
// sozinho nos scripts dele, porque o lê do cabeçalho do pedido.
function regras(nonce) {
  const dev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // As cores das etapas e as posições no calendário vêm em style="...".
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

// Primeira barreira: sem sessão válida, tudo cai no login — menos "/", que
// mostra a landing page.
// A verificação séria é repetida na página e em cada ação que toca no banco.
// O endereço oficial é sem www. Quem chega por www vai para lá, com o mesmo
// caminho, num redirecionamento permanente (301): o Google e as IAs ficam
// só com um endereço.
const OFICIAL = "firstmediacrm.online";

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;

  if (request.headers.get("host") === `www.${OFICIAL}`) {
    return NextResponse.redirect(`https://${OFICIAL}${pathname}${search}`, 301);
  }

  const publica = PUBLICAS.has(pathname) || PUBLICAS_PREFIXO.some((p) => pathname.startsWith(p));
  const cookie = request.cookies.get(NOME_COOKIE)?.value;

  // Rota exata: "startsWith" deixaria passar caminhos como /login-qualquer-coisa.
  let landing = false;
  if (!publica && !(await sessaoValida(cookie))) {
    if (pathname !== "/") return NextResponse.redirect(new URL("/login", request.url));
    landing = true;
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = regras(nonce);

  const cabecalhos = new Headers(request.headers);
  cabecalhos.set("x-nonce", nonce);
  cabecalhos.set("Content-Security-Policy", csp);

  const resposta = landing
    ? NextResponse.rewrite(new URL("/inicio", request.url), { request: { headers: cabecalhos } })
    : NextResponse.next({ request: { headers: cabecalhos } });
  resposta.headers.set("Content-Security-Policy", csp);
  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
