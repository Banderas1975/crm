"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase } from "../lib/supabase";
import { criarHash, senhaConfere } from "../lib/senha";
import { NOME_COOKIE } from "../lib/sessao";
import { exigirAdmin } from "./acesso";
import { envioConfigurado } from "../lib/email";
import { enviarUmaVez, emailAprovado } from "./avisos";
import { abrirSessao, criarContaExperiencia, podeEntrar, experienciaTerminou } from "./contas";
import { LIMITES, emailValido, idValido, montarTelefone } from "../lib/validacao";
import { ipDoPedido, bloqueado, contar, limpar } from "../lib/limites";

const SENHA_MINIMA = 8;

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
    .select("id, senha_hash, estado, experiencia_ate")
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

  // Aprovada, ou ainda dentro dos 14 dias grátis.
  if (!podeEntrar(utilizador)) {
    redirect(experienciaTerminou(utilizador) ? "/login?erro=experiencia" : "/login?erro=pendente");
  }

  await abrirSessao(utilizador.id);

  redirect("/");
}

// Criar conta: começa logo os 14 dias grátis e entra no CRM, sem esperar pelo
// administrador. A aprovação só é precisa para continuar depois dos 14 dias.
export async function registar(dados) {
  // Campo escondido que só um robô preenche. Finge que correu bem e não grava nada.
  if ((dados.get("site") ?? "") !== "") redirect("/login");

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

  const conta = await criarContaExperiencia({ nome, email, telefone, senha });
  if (conta.erro) redirect(`/registo?erro=${conta.erro}`);

  await abrirSessao(conta.id);
  redirect("/");
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

  // Também acaba com os 14 dias de experiência, se ainda os tinha: sem isto, a
  // conta voltava a entrar enquanto a experiência não terminasse.
  await supabase.from("usuarios").update({ estado: "pendente", experiencia_ate: null }).eq("id", id);
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
