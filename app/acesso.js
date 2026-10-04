// Verificação de sessão, só para o servidor. Fica fora do sessao-actions.js
// de propósito: num ficheiro "use server", cada função exportada vira um
// endereço que qualquer pessoa pode chamar de fora — e estas não são ações.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "../lib/supabase";
import { lerSessao, sessaoCriadaEm, NOME_COOKIE } from "../lib/sessao";

// Devolve o utilizador da sessão, ou manda para o login.
// Chamada no topo de tudo o que lê ou escreve dados.
export async function exigirSessao() {
  const cookie = (await cookies()).get(NOME_COOKIE)?.value;
  const id = await lerSessao(cookie);
  if (!id) redirect("/login");

  const { data: utilizador } = await supabase
    .from("usuarios")
    .select("id, email, papel, estado, senha_alterada_em")
    .eq("id", id)
    .single();

  // Conta apagada ou desaprovada entretanto: a sessão deixa de valer.
  if (!utilizador || utilizador.estado !== "aprovado") redirect("/login");

  // A senha mudou depois de esta sessão começar: quem a tinha aberta fica de fora.
  if (utilizador.senha_alterada_em && Date.parse(utilizador.senha_alterada_em) > sessaoCriadaEm(cookie)) {
    redirect("/login");
  }

  const { senha_alterada_em, ...resto } = utilizador;
  return resto;
}

export async function exigirAdmin() {
  const utilizador = await exigirSessao();
  if (utilizador.papel !== "admin") redirect("/");
  return utilizador;
}
