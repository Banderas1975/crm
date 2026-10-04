"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../lib/supabase";
import { exigirSessao } from "./acesso";
import { enviarUmaVez, emailDeTeste } from "./avisos";
import { envioConfigurado } from "../lib/email";
import { LIMITES, emailValido } from "../lib/validacao";

export async function guardarPreferencias(estadoAnterior, dados) {
  const eu = await exigirSessao();

  const emailAvisos = dados.get("email_avisos")?.trim().toLowerCase() || null;
  if (emailAvisos && (!emailValido(emailAvisos) || emailAvisos.length > LIMITES.email)) {
    return { erro: "Esse email não parece válido." };
  }

  const { error } = await supabase
    .from("usuarios")
    .update({
      email_avisos: emailAvisos,
      aviso_tarefas: dados.get("aviso_tarefas") === "on",
      aviso_tarefa_antes: dados.get("aviso_tarefa_antes") === "on",
      aviso_reuniao_antes: dados.get("aviso_reuniao_antes") === "on",
      aviso_reuniao_alterada: dados.get("aviso_reuniao_alterada") === "on",
    })
    .eq("id", eu.id);
  if (error) return { erro: "Não foi possível guardar. Tente de novo." };

  revalidatePath("/emails");
  return { erro: "", salvo: (estadoAnterior?.salvo ?? 0) + 1 };
}

// Um email de teste para o endereço de avisos de quem pede. No máximo um por
// minuto: a chave leva o minuto, e a mesma chave nunca sai duas vezes.
export async function enviarTeste(estadoAnterior) {
  const eu = await exigirSessao();
  if (!envioConfigurado()) return { erro: "O envio de email ainda não está configurado no servidor." };

  const { data: conta } = await supabase.from("usuarios").select("email, email_avisos").eq("id", eu.id).single();
  const para = conta?.email_avisos || conta?.email;
  const minuto = new Date().toISOString().slice(0, 16);
  const { texto, html } = emailDeTeste();

  const resultado = await enviarUmaVez({
    usuarioId: eu.id,
    chave: `teste:${eu.id}:${minuto}`,
    tipo: "teste",
    para,
    assunto: "Email de teste do CRM",
    texto,
    html,
  });

  revalidatePath("/emails");
  if (resultado === "enviado") return { erro: "", aviso: `Enviado para ${para}. Veja a caixa de entrada (e o spam).` };
  if (resultado === "ja") return { erro: "Já enviou um teste neste minuto. Espere um pouco." };
  return { erro: "O envio falhou. O motivo aparece no histórico abaixo." };
}
