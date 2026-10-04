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

  const nome = texto(dados, "nome", LIMITES.nome);
  const email = texto(dados, "email", LIMITES.email)?.toLowerCase();
  const telefone = texto(dados, "telefone", 40);
  const empresa = texto(dados, "empresa", LIMITES.nome);
  const mensagem = texto(dados, "mensagem", 1000);
  const utilizadores = Number(dados.get("utilizadores"));

  if (!nome) return { erro: "Escreva o seu nome." };
  if (!email || !emailValido(email)) return { erro: "Esse email não parece válido." };
  if (telefone === null || (telefone && !/^[+\d][\d\s()-]{5,39}$/.test(telefone))) {
    return { erro: "Esse telefone não parece válido." };
  }
  if (!empresa) return { erro: "Escreva o nome da empresa." };
  if (!Number.isInteger(utilizadores) || utilizadores < 1 || utilizadores > 1000) {
    return { erro: "Indique quantos utilizadores (de 1 a 1000)." };
  }
  if (mensagem === null) return { erro: "A mensagem é muito comprida (máximo 1000 caracteres)." };
  if (dados.get("consentimento") !== "sim") {
    return { erro: "Para o podermos contactar, marque a caixa do consentimento." };
  }

  const enviado = { erro: "", enviado: true };

  // O mesmo email no máximo 3 vezes por dia: chega para enganos, trava abusos.
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("criado_em", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if (count >= MAX_POR_DIA) return enviado;

  const lead = { nome, email, telefone: telefone || null, empresa, utilizadores, mensagem: mensagem || null };
  const { data: novo, error } = await supabase
    .from("leads")
    .insert({ ...lead, consentimento_em: new Date().toISOString() })
    .select("id")
    .single();
  if (error) {
    console.error("Falha a gravar lead:", error.message);
    return { erro: "Não foi possível enviar o pedido. Tente de novo daqui a pouco." };
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
      assunto: `Lead novo: ${lead.empresa}`,
      texto: corpo,
      html,
    });
  }
}
