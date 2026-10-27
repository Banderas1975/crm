"use server";

import { supabase } from "../lib/supabase";
import { envioConfigurado } from "../lib/email";
import { enviarUmaVez, emailLead } from "./avisos";
import { LIMITES, emailValido } from "../lib/validacao";
import { ipDoPedido, bloqueado, contar } from "../lib/limites";
import { abrirSessao, criarContaExperiencia } from "./contas";

const MAX_POR_DIA = 10; // pedidos do mesmo email em 24 horas
const MAX_POR_IP = 20; // pedidos da mesma ligação (IP) em 24 horas, com quaisquer emails
const DIA_MS = 24 * 60 * 60 * 1000;

const texto = (dados, campo, max) => {
  const valor = (dados.get(campo) ?? "").toString().trim();
  return valor.length <= max ? valor : null;
};

// Formulário da landing page: cria logo a conta com 14 dias grátis, abre a
// sessão (a pessoa entra no CRM sem passar pelo login), grava o lead e avisa os
// administradores por email.
const SENHA_MINIMA = 8;
const ERROS_CONTA = {
  repetido: "Já existe uma conta com esse email. Entre no CRM com a sua senha.",
  muitos: "Estamos a receber muitos registos neste momento. Tente de novo daqui a uma hora.",
  geral: "Não foi possível criar a conta. Tente de novo daqui a pouco.",
};
export async function pedirExperiencia(estadoAnterior, dados) {
  // Campo escondido que só um robô preenche. Fingimos que correu bem.
  if ((dados.get("site") ?? "") !== "") return { erro: "", enviado: true };

  // Se algo falhar, o formulário volta preenchido com o que a pessoa escreveu
  // (o React limpa o formulário depois de cada envio).
  const valores = Object.fromEntries(
    ["nome", "email", "telefone", "empresa", "mensagem", "consentimento"].map((c) => [
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

  if (!nome) return falha("Escreva o seu nome.");
  if (!email || !emailValido(email)) return falha("Esse email não parece válido.");
  if (telefone === null) return falha("O telefone é muito comprido.");
  // Opcional; se vier escrito, tem de parecer um telefone.
  if (telefone && !/^[+\d][\d\s()-]{5,39}$/.test(telefone)) {
    return falha("Esse telefone não parece válido.");
  }
  if (empresa === null) return falha("O nome da empresa é muito comprido.");
  if (mensagem === null) return falha("A mensagem é muito comprida (máximo 1000 caracteres).");
  const senha = String(dados.get("senha") ?? "");
  if (senha.length < SENHA_MINIMA) return falha(`A senha tem de ter pelo menos ${SENHA_MINIMA} caracteres.`);
  if (senha.length > LIMITES.senha) return falha("A senha é muito comprida.");
  if (dados.get("consentimento") !== "sim") {
    return falha("Para o podermos contactar, marque a caixa do consentimento.");
  }

  const enviado = { erro: "", enviado: true };

  // O mesmo email no máximo 10 vezes por dia: chega para enganos e testes, trava abusos.
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("criado_em", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if (count >= MAX_POR_DIA) {
    return falha("Já recebemos vários pedidos com este email hoje. Vamos entrar em contacto consigo em breve; pode tentar de novo amanhã.");
  }

  // A mesma ligação no máximo 20 vezes por dia: um robô que troque de email a
  // cada envio também fica travado. Sem IP conhecido, fica só o limite por email.
  const ip = await ipDoPedido();
  if (ip && (await bloqueado(`lead-ip:${ip}`))) {
    return falha("Recebemos demasiados pedidos a partir desta ligação hoje. Tente de novo amanhã.");
  }

  // A conta primeiro: se o email já tem conta, nada fica gravado.
  // Na conta, o telefone fica só com os dígitos (e o + do indicativo).
  const telefoneConta = telefone ? telefone.replace(/[^\d+]/g, "").slice(0, 20) || null : null;
  const conta = await criarContaExperiencia({ nome, email, telefone: telefoneConta, senha });
  if (conta.erro) return falha(ERROS_CONTA[conta.erro]);

  const lead = { nome, email, telefone: telefone || null, empresa: empresa || null, mensagem: mensagem || null };
  const { data: novo, error } = await supabase
    .from("leads")
    .insert({ ...lead, consentimento_em: new Date().toISOString() })
    .select("id")
    .single();
  // A conta já existe: uma falha aqui só se regista, não impede a pessoa de entrar.
  if (error) console.error("Falha a gravar lead:", error.message);

  if (ip) await contar(`lead-ip:${ip}`, MAX_POR_IP, DIA_MS, DIA_MS);

  // O aviso sai em segundo plano: quem preenche não fica à espera do email.
  if (novo && envioConfigurado()) {
    avisarAdministradores(novo.id, lead).catch((e) => console.error("Falha no aviso de lead:", e.message));
  }

  await abrirSessao(conta.id);
  // O email volta ao navegador só para as conversões otimizadas do Google Ads.
  return { ...enviado, dados: { email } };
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
