// Verificação de sessão, só para o servidor. Fica fora do sessao-actions.js
// de propósito: num ficheiro "use server", cada função exportada vira um
// endereço que qualquer pessoa pode chamar de fora — e estas não são ações.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "../lib/supabase";
import { lerSessao, NOME_COOKIE } from "../lib/sessao";

// Devolve o utilizador da sessão, ou manda para o login.
// Chamada no topo de tudo o que lê ou escreve dados.
export async function exigirSessao() {
  const id = await lerSessao((await cookies()).get(NOME_COOKIE)?.value);
  if (!id) redirect("/login");

  const { data: utilizador } = await supabase
    .from("usuarios")
    .select("id, email, papel, estado")
    .eq("id", id)
    .single();

  // Conta apagada ou desaprovada entretanto: a sessão deixa de valer.
  if (!utilizador || utilizador.estado !== "aprovado") redirect("/login");

  return utilizador;
}

export async function exigirAdmin() {
  const utilizador = await exigirSessao();
  if (utilizador.papel !== "admin") redirect("/");
  return utilizador;
}
