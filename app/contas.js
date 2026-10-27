// Contas de experiência (14 dias grátis). Só para o servidor e fora dos
// ficheiros "use server": nada daqui pode ser chamado de fora como uma ação.
import { cookies } from "next/headers";
import { supabase } from "../lib/supabase";
import { criarHash } from "../lib/senha";
import { criarSessao, NOME_COOKIE, DURACAO_SEGUNDOS } from "../lib/sessao";
import { envioConfigurado } from "../lib/email";
import { enviarUmaVez, emailRegisto, emailBoasVindas } from "./avisos";

export const DIAS_EXPERIENCIA = 14;

// Contas novas por hora, de toda a gente junta. Chega para um dia normal e
// trava um robô a criar centenas de contas (e a mandar centenas de avisos).
const MAX_REGISTOS_HORA = 10;

// Uma conta entra no CRM se foi aprovada pelo administrador, ou se ainda está
// dentro dos 14 dias de experiência. "Remover acesso" apaga a experiência.
export const emExperiencia = (u) =>
  u?.estado === "pendente" && Boolean(u.experiencia_ate) && Date.parse(u.experiencia_ate) > Date.now();
export const experienciaTerminou = (u) =>
  u?.estado === "pendente" && Boolean(u.experiencia_ate) && Date.parse(u.experiencia_ate) <= Date.now();
export const podeEntrar = (u) => u?.estado === "aprovado" || emExperiencia(u);

// Abre a sessão no navegador de quem fez o pedido (o mesmo cookie do login).
export async function abrirSessao(id) {
  (await cookies()).set(NOME_COOKIE, await criarSessao(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO_SEGUNDOS,
  });
}

// Cria a conta com 14 dias de experiência e avisa por email a pessoa e os
// administradores. Devolve { id } ou { erro: "muitos" | "repetido" | "geral" }.
// Os dados já chegam validados.
export async function criarContaExperiencia({ nome, email, telefone, senha }) {
  const { count } = await supabase
    .from("usuarios")
    .select("id", { count: "exact", head: true })
    .gte("criado_em", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if (count >= MAX_REGISTOS_HORA) return { erro: "muitos" };

  const experienciaAte = new Date(Date.now() + DIAS_EXPERIENCIA * 24 * 60 * 60 * 1000).toISOString();
  const { data: nova, error } = await supabase
    .from("usuarios")
    .insert({ nome, email, telefone, senha_hash: await criarHash(senha), experiencia_ate: experienciaAte })
    .select("id")
    .single();
  // 23505 = email repetido (a coluna é unique).
  if (error?.code === "23505") return { erro: "repetido" };
  if (error) {
    console.error("Falha a criar conta:", error.message);
    return { erro: "geral" };
  }

  // Os emails saem em segundo plano: quem se regista não fica à espera deles.
  if (envioConfigurado()) {
    const conta = { nome, email, telefone, experienciaAte };
    avisarAdministradores(nova.id, conta).catch((e) => console.error("Falha no aviso de conta nova:", e.message));
    const { texto, html } = emailBoasVindas(conta);
    enviarUmaVez({
      usuarioId: nova.id,
      chave: `registo-recebido:${nova.id}`,
      tipo: "registo_recebido",
      para: email,
      assunto: "Os seus 14 dias grátis no First Media CRM começaram",
      texto,
      html,
    }).catch((e) => console.error("Falha no email de boas-vindas:", e.message));
  }

  return { id: nova.id };
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
      assunto: `Conta nova em experiência: ${conta.nome}`,
      texto,
      html,
    });
  }
}
