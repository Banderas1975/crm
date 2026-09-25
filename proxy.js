import { NextResponse } from "next/server";
import { NOME_COOKIE, sessaoValida } from "./lib/sessao";

// As únicas páginas que se veem sem sessão.
const PUBLICAS = new Set(["/login", "/registo"]);

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

// Primeira barreira: sem sessão válida, tudo cai no login.
// A verificação séria é repetida na página e em cada ação que toca no banco.
export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const publica = PUBLICAS.has(pathname);
  const cookie = request.cookies.get(NOME_COOKIE)?.value;

  // Rota exata: "startsWith" deixaria passar caminhos como /login-qualquer-coisa.
  if (!publica && !(await sessaoValida(cookie))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = regras(nonce);

  const cabecalhos = new Headers(request.headers);
  cabecalhos.set("x-nonce", nonce);
  cabecalhos.set("Content-Security-Policy", csp);

  const resposta = NextResponse.next({ request: { headers: cabecalhos } });
  resposta.headers.set("Content-Security-Policy", csp);
  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
