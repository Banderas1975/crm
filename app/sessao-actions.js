"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "../lib/supabase";
import { criarHash, senhaConfere } from "../lib/senha";
import { criarSessao, lerSessao, NOME_COOKIE, DURACAO_SEGUNDOS } from "../lib/sessao";
import { LIMITES, emailValido } from "../lib/validacao";

const SENHA_MINIMA = 8;

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

export async function entrar(dados) {
  const email = (dados.get("email") ?? "").trim().toLowerCase();
  const senha = dados.get("senha") ?? "";

  // Recusa já aqui o que nunca poderia ser uma credencial válida.
  if (!email || email.length > LIMITES.email || senha.length > LIMITES.senha) {
    redirect("/login?erro=invalido");
  }

  const { data: utilizador } = await supabase
    .from("usuarios")
    .select("id, senha_hash, estado")
    .eq("email", email)
    .single();

  // Uma mensagem só: não dizemos se falhou o email ou a senha.
  if (!utilizador || !(await senhaConfere(senha, utilizador.senha_hash))) {
    redirect("/login?erro=invalido");
  }

  if (utilizador.estado !== "aprovado") redirect("/login?erro=pendente");

  (await cookies()).set(NOME_COOKIE, await criarSessao(utilizador.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO_SEGUNDOS,
  });

  redirect("/");
}

export async function registar(dados) {
  const email = (dados.get("email") ?? "").trim().toLowerCase();
  const senha = dados.get("senha") ?? "";

  if (!emailValido(email) || email.length > LIMITES.email) redirect("/registo?erro=email");
  // O limite máximo também protege o servidor: cifrar uma senha gigante custa tempo de CPU.
  if (senha.length < SENHA_MINIMA || senha.length > LIMITES.senha) redirect("/registo?erro=senha");

  const { error } = await supabase.from("usuarios").insert({
    email,
    senha_hash: await criarHash(senha),
  });

  // 23505 = email repetido (a coluna é unique).
  if (error?.code === "23505") redirect("/registo?erro=repetido");
  if (error) redirect("/registo?erro=geral");

  redirect("/login?registado=1");
}

export async function sair() {
  (await cookies()).delete(NOME_COOKIE);
  redirect("/login");
}

export async function aprovarUtilizador(dados) {
  await exigirAdmin();

  const id = Number(dados.get("id"));
  if (!id) return;

  await supabase.from("usuarios").update({ estado: "aprovado" }).eq("id", id);
  revalidatePath("/usuarios");
}

// Recusa uma conta à espera: apaga-a. A pessoa pode registar-se de novo.
export async function recusarUtilizador(dados) {
  const admin = await exigirAdmin();

  const id = Number(dados.get("id"));
  // Nunca sobre a própria conta: senão o admin trancava-se fora do sistema.
  if (!id || id === admin.id) return;

  await supabase.from("usuarios").delete().eq("id", id);
  revalidatePath("/usuarios");
}

// Tira o acesso sem apagar a conta: volta à fila de espera.
// A sessão dele deixa de valer no pedido seguinte.
export async function removerAcesso(dados) {
  const admin = await exigirAdmin();

  const id = Number(dados.get("id"));
  if (!id || id === admin.id) return;

  await supabase.from("usuarios").update({ estado: "pendente" }).eq("id", id);
  revalidatePath("/usuarios");
}

export async function promoverAdmin(dados) {
  const admin = await exigirAdmin();

  const id = Number(dados.get("id"));
  if (!id || id === admin.id) return;

  await supabase.from("usuarios").update({ papel: "admin" }).eq("id", id);
  revalidatePath("/usuarios");
}

export async function despromoverAdmin(dados) {
  const admin = await exigirAdmin();

  const id = Number(dados.get("id"));
  if (!id || id === admin.id) return;

  await supabase.from("usuarios").update({ papel: "usuario" }).eq("id", id);
  revalidatePath("/usuarios");
}
