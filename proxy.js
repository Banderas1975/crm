import { NextResponse } from "next/server";
import { NOME_COOKIE, sessaoValida } from "./lib/sessao";

// As únicas páginas que se veem sem sessão.
const PUBLICAS = new Set(["/login", "/registo"]);

// Primeira barreira: sem sessão válida, tudo cai no login.
// A verificação séria é repetida na página e em cada ação que toca no banco.
export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Rota exata: "startsWith" deixaria passar caminhos como /login-qualquer-coisa.
  if (PUBLICAS.has(pathname)) return NextResponse.next();

  const cookie = request.cookies.get(NOME_COOKIE)?.value;
  if (await sessaoValida(cookie)) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
