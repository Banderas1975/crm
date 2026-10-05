"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "../lib/supabase";
import { criarHash, senhaConfere } from "../lib/senha";
import { criarSessao, NOME_COOKIE, DURACAO_SEGUNDOS } from "../lib/sessao";
import { exigirAdmin } from "./acesso";
import { envioConfigurado } from "../lib/email";
import { enviarUmaVez, emailRegisto, emailAprovado } from "./avisos";
import { LIMITES, emailValido, idValido, montarTelefone } from "../lib/validacao";
import { ipDoPedido, bloqueado, contar, limpar } from "../lib/limites";

const SENHA_MINIMA = 8;

// Contas novas por hora, de toda a gente junta. Chega para um dia normal e
// trava um robô a criar centenas de contas (e a mandar centenas de avisos).
const MAX_REGISTOS_HORA = 10;

// Travão contra quem tenta adivinhar senhas, em duas partes:
// - 5 falhas com o mesmo email, a partir da mesma ligação (IP), bloqueiam esse
//   par durante 15 minutos. Quem erra de propósito a senha do administrador só
//   se bloqueia a si próprio: o administrador, noutra ligação, continua a entrar.
// - 20 falhas a partir da mesma ligação, em quaisquer emails, bloqueiam essa
//   ligação durante 15 minutos: trava quem experimenta muitos emails.
// Sem IP conhecido (nginx sem X-Real-IP), conta-se só por email, como antes.
// Conta-se exista a conta ou não, para o bloqueio não revelar que emails têm conta.
const MAX_FALHAS = 5;
const MAX_FALHAS_IP = 20;
const BLOQUEIO_MS = 15 * 60 * 1000;

// Um hash que não abre conta nenhuma. Conferir a senha contra ele quando o
// email não existe gasta o mesmo tempo que uma conta real: assim a demora da
// resposta não denuncia que emails estão registados.
let hashFalso;
const obterHashFalso = () => (hashFalso ??= criarHash(crypto.randomUUID()));

export async function entrar(dados) {
  const email = (dados.get("email") ?? "").trim().toLowerCase();
  const senha = dados.get("senha") ?? "";

  // Recusa já aqui o que nunca poderia ser uma credencial válida.
  if (!email || email.length > LIMITES.email || senha.length > LIMITES.senha) {
    redirect("/login?erro=invalido");
  }

  const ip = await ipDoPedido();
  const chaveEmail = ip ? `login:${email}|${ip}` : `login:${email}`;
  const chaveIp = ip && `login-ip:${ip}`;

  // Bloqueado: nem se confere a senha, mesmo que agora viesse certa.
  if ((await bloqueado(chaveEmail)) || (chaveIp && (await bloqueado(chaveIp)))) {
    redirect("/login?erro=bloqueado");
  }

  const { data: utilizador } = await supabase
    .from("usuarios")
    .select("id, senha_hash, estado")
    .eq("email", email)
    .single();

  const certa = await senhaConfere(senha, utilizador?.senha_hash ?? (await obterHashFalso()));

  // Uma mensagem só: não dizemos se falhou o email ou a senha.
  if (!utilizador || !certa) {
    const porEmail = await contar(chaveEmail, MAX_FALHAS, BLOQUEIO_MS, BLOQUEIO_MS);
    const porIp = chaveIp ? await contar(chaveIp, MAX_FALHAS_IP, BLOQUEIO_MS, BLOQUEIO_MS) : false;
    redirect(porEmail || porIp ? "/login?erro=bloqueado" : "/login?erro=invalido");
  }

  // Senha certa: a contagem deste email recomeça do zero.
  await limpar(chaveEmail);

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
  // Campo escondido que só um robô preenche. Finge que correu bem e não grava nada.
  if ((dados.get("site") ?? "") !== "") redirect("/registo?concluido=1");

  const nome = (dados.get("nome") ?? "").trim();
  const email = (dados.get("email") ?? "").trim().toLowerCase();
  const senha = dados.get("senha") ?? "";

  if (!nome || nome.length > LIMITES.nome) redirect("/registo?erro=nome");
  // Obrigatório: um número vazio também conta como erro.
  const { telefone } = montarTelefone(dados.get("indicativo"), dados.get("telefone"));
  if (!telefone) redirect("/registo?erro=telefone");
  if (!emailValido(email) || email.length > LIMITES.email) redirect("/registo?erro=email");
  // O limite máximo também protege o servidor: cifrar uma senha gigante custa tempo de CPU.
  if (senha.length < SENHA_MINIMA || senha.length > LIMITES.senha) redirect("/registo?erro=senha");

  const { count } = await supabase
    .from("usuarios")
    .select("id", { count: "exact", head: true })
    .gte("criado_em", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if (count >= MAX_REGISTOS_HORA) redirect("/registo?erro=muitos");

  const { data: nova, error } = await supabase
    .from("usuarios")
    .insert({ nome, email, telefone, senha_hash: await criarHash(senha) })
    .select("id")
    .single();

  // 23505 = email repetido (a coluna é unique).
  if (error?.code === "23505") redirect("/registo?erro=repetido");
  if (error) redirect("/registo?erro=geral");

  // O aviso sai em segundo plano: quem se regista não fica à espera do email.
  if (envioConfigurado()) {
    avisarAdministradores(nova.id, { nome, email, telefone }).catch((e) =>
      console.error("Falha no aviso de conta nova:", e.message),
    );
  }

  redirect("/registo?concluido=1");
}

// Um email para cada administrador (para o email de avisos, se tiver um).
async function avisarAdministradores(id, conta) {
  const { data: admins, error } = await supabase
    .from("usuarios")
    .select("id, email, email_avisos")
    .eq("papel", "admin")
    .eq("estado", "aprovado");
  if (error) throw new Error(error.message);

  const { texto, html } = emailRegisto(conta);
  for (const admin of admins) {
    await enviarUmaVez({
      usuarioId: admin.id,
      chave: `registo:${id}:${admin.id}`,
      tipo: "registo",
      para: admin.email_avisos || admin.email,
      assunto: `Conta nova: ${conta.nome}`,
      texto,
      html,
    });
  }
}

export async function sair() {
  (await cookies()).delete(NOME_COOKIE);
  redirect("/login");
}

export async function aprovarUtilizador(dados) {
  await exigirAdmin();

  const id = Number(dados.get("id"));
  if (!idValido(id)) return;

  // Só muda quem estava à espera: dois cliques seguidos não enviam dois emails.
  const { data: aprovada } = await supabase
    .from("usuarios")
    .update({ estado: "aprovado" })
    .eq("id", id)
    .eq("estado", "pendente")
    .select("id, email")
    .maybeSingle();

  // O email sai em segundo plano: o administrador não fica à espera dele.
  // A chave leva a hora, para uma conta reaprovada (depois de "Remover acesso") ser avisada outra vez.
  if (aprovada && envioConfigurado()) {
    const { texto, html } = emailAprovado();
    enviarUmaVez({
      usuarioId: aprovada.id,
      chave: `aprovado:${aprovada.id}:${Date.now()}`,
      tipo: "aprovado",
      para: aprovada.email,
      assunto: "A sua conta do First Media CRM foi ativada",
      texto,
      html,
    }).catch((e) => console.error("Falha no email de conta ativada:", e.message));
  }

  revalidatePath("/usuarios");
}

// Recusa uma conta à espera: apaga-a. A pessoa pode registar-se de novo.
// Só contas à espera: uma conta aprovada nunca se apaga por aqui. E uma conta
// que já tem contatos não se apaga de todo — o banco recusa (on delete restrict),
// para os dados de ninguém desaparecerem por um clique.
export async function recusarUtilizador(dados) {
  const admin = await exigirAdmin();

  const id = Number(dados.get("id"));
  // Nunca sobre a própria conta: senão o admin trancava-se fora do sistema.
  if (!idValido(id) || id === admin.id) return;

  await supabase.from("usuarios").delete().eq("id", id).eq("estado", "pendente");
  revalidatePath("/usuarios");
}

// Tira o acesso sem apagar a conta: volta à fila de espera.
// A sessão dele deixa de valer no pedido seguinte.
export async function removerAcesso(dados) {
  const admin = await exigirAdmin();

  const id = Number(dados.get("id"));
  if (!idValido(id) || id === admin.id) return;

  await supabase.from("usuarios").update({ estado: "pendente" }).eq("id", id);
  revalidatePath("/usuarios");
}

export async function promoverAdmin(dados) {
  const admin = await exigirAdmin();

  const id = Number(dados.get("id"));
  if (!idValido(id) || id === admin.id) return;

  await supabase.from("usuarios").update({ papel: "admin" }).eq("id", id);
  revalidatePath("/usuarios");
}

export async function despromoverAdmin(dados) {
  const admin = await exigirAdmin();

  const id = Number(dados.get("id"));
  if (!idValido(id) || id === admin.id) return;

  await supabase.from("usuarios").update({ papel: "usuario" }).eq("id", id);
  revalidatePath("/usuarios");
}
