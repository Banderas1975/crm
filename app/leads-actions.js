"use server";

import { supabase } from "../lib/supabase";
import { envioConfigurado } from "../lib/email";
import { enviarUmaVez, emailLead } from "./avisos";
import { LIMITES, emailValido } from "../lib/validacao";

const MAX_POR_DIA = 3; // pedidos do mesmo email em 24 horas

const texto = (dados, campo, max) => {
  const valor = (dados.get(campo) ?? "").toString().trim();
  return valor.length <= max ? valor : null;
};

// Formulário da landing page: grava o lead e avisa os administradores por email.
export async function pedirExperiencia(estadoAnterior, dados) {
  // Campo escondido que só um robô preenche. Fingimos que correu bem.
  if ((dados.get("site") ?? "") !== "") return { erro: "", enviado: true };

  // Se algo falhar, o formulário volta preenchido com o que a pessoa escreveu
  // (o React limpa o formulário depois de cada envio).
  const valores = Object.fromEntries(
    ["nome", "email", "telefone", "empresa", "utilizadores", "mensagem", "consentimento"].map((c) => [
      c,
      String(dados.get(c) ?? "").slice(0, 1000),
    ]),
  );
  const falha = (erro) => ({ erro, valores });

  const nome = texto(dados, "nome", LIMITES.nome);
  const email = texto(dados, "email", LIMITES.email)?.toLowerCase();
  const telefone = texto(dados, "telefone", 40);
  const empresa = texto(dados, "empresa", LIMITES.nome);
  const mensagem = texto(dados, "mensagem", 1000);
  const utilizadores = Number(dados.get("utilizadores"));

  if (!nome) return falha("Escreva o seu nome.");
  if (!email || !emailValido(email)) return falha("Esse email não parece válido.");
  if (!telefone) return falha("Escreva o seu telefone.");
  if (!/^[+\d][\d\s()-]{5,39}$/.test(telefone)) {
    return falha("Esse telefone não parece válido.");
  }
  if (empresa === null) return falha("O nome da empresa é muito comprido.");
  if (!Number.isInteger(utilizadores) || utilizadores < 1 || utilizadores > 1000) {
    return falha("Indique quantos utilizadores (de 1 a 1000).");
  }
  if (mensagem === null) return falha("A mensagem é muito comprida (máximo 1000 caracteres).");
  if (dados.get("consentimento") !== "sim") {
    return falha("Para o podermos contactar, marque a caixa do consentimento.");
  }

  const enviado = { erro: "", enviado: true };

  // O mesmo email no máximo 3 vezes por dia: chega para enganos, trava abusos.
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("criado_em", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if (count >= MAX_POR_DIA) return enviado;

  const lead = { nome, email, telefone, empresa: empresa || null, utilizadores, mensagem: mensagem || null };
  const { data: novo, error } = await supabase
    .from("leads")
    .insert({ ...lead, consentimento_em: new Date().toISOString() })
    .select("id")
    .single();
  if (error) {
    console.error("Falha a gravar lead:", error.message);
    return falha("Não foi possível enviar o pedido. Tente de novo daqui a pouco.");
  }

  // O aviso sai em segundo plano: quem preenche não fica à espera do email.
  if (envioConfigurado()) avisarAdministradores(novo.id, lead).catch((e) => console.error("Falha no aviso de lead:", e.message));

  return enviado;
}

async function avisarAdministradores(id, lead) {
  const { data: admins, error } = await supabase
    .from("usuarios")
    .select("id, email, email_avisos")
    .eq("papel", "admin")
    .eq("estado", "aprovado");
  if (error) throw new Error(error.message);

  const { texto: corpo, html } = emailLead(lead);
  for (const admin of admins) {
    await enviarUmaVez({
      usuarioId: admin.id,
      chave: `lead:${id}:${admin.id}`,
      tipo: "lead",
      para: admin.email_avisos || admin.email,
      assunto: `Lead novo: ${lead.empresa || lead.nome}`,
      texto: corpo,
      html,
    });
  }
}
