"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { supabase } from "../lib/supabase";
import { criarHash } from "../lib/senha";
import { envioConfigurado } from "../lib/email";
import { enviarUmaVez, emailRecuperacao } from "./avisos";
import { LIMITES, emailValido } from "../lib/validacao";

const SENHA_MINIMA = 8;
const VALIDADE_MS = 60 * 60 * 1000; // 1 hora
const MAX_PEDIDOS_HORA = 3;

// Do código do link só se guarda o hash.
const hashDe = (token) => createHash("sha256").update(token).digest("hex");

// A resposta é sempre a mesma, exista a conta ou não: o formulário não diz que
// emails estão registados. O email sai em segundo plano, para a demora também
// não o dizer.
export async function pedirRecuperacao(estadoAnterior, dados) {
  const email = (dados.get("email") ?? "").trim().toLowerCase();
  if (!emailValido(email) || email.length > LIMITES.email) return { erro: "Esse email não parece válido." };

  // O link aponta sempre para o CRM_URL do .env — nunca para o endereço que vem
  // no pedido, que um atacante podia trocar para mandar as pessoas para um site falso.
  const base = process.env.CRM_URL?.replace(/\/$/, "");
  if (!base || !envioConfigurado()) {
    return { erro: "A recuperação por email não está configurada. Fale com o administrador." };
  }

  const enviado = { erro: "", enviado: true };

  const { data: conta } = await supabase
    .from("usuarios")
    .select("id, email, email_avisos, estado")
    .eq("email", email)
    .maybeSingle();
  if (!conta || conta.estado !== "aprovado") return enviado;

  // No máximo 3 pedidos por hora para a mesma conta.
  const { count } = await supabase
    .from("recuperacoes_senha")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", conta.id)
    .gte("criado_em", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if (count >= MAX_PEDIDOS_HORA) return enviado;

  const token = randomBytes(32).toString("base64url");
  const { error } = await supabase.from("recuperacoes_senha").insert({
    usuario_id: conta.id,
    token_hash: hashDe(token),
    expira_em: new Date(Date.now() + VALIDADE_MS).toISOString(),
  });
  if (error) {
    console.error("Falha a criar recuperação de senha:", error.message);
    return enviado;
  }

  // Vai para o email da conta (o de login), não para o email de avisos: é o que
  // a pessoa provou ter quando criou a conta.
  const { texto, html } = emailRecuperacao(`${base}/recuperar/${token}`);
  enviarUmaVez({
    usuarioId: conta.id,
    chave: `recuperar:${hashDe(token).slice(0, 32)}`,
    tipo: "recuperar",
    para: conta.email,
    assunto: "Mudar a password do CRM",
    texto,
    html,
  }).catch((erro) => console.error("Falha a enviar recuperação:", erro.message));

  return enviado;
}

// Troca a senha. O link só é gasto se tudo estiver certo, e numa operação só:
// dois envios ao mesmo tempo com o mesmo link não trocam a senha duas vezes.
export async function definirSenha(estadoAnterior, dados) {
  const token = dados.get("token") ?? "";
  const senha = dados.get("senha") ?? "";
  const confirmacao = dados.get("confirmacao") ?? "";

  if (senha.length < SENHA_MINIMA) return { erro: `A password tem de ter pelo menos ${SENHA_MINIMA} caracteres.` };
  if (senha.length > LIMITES.senha) return { erro: "A password é muito comprida." };
  if (senha !== confirmacao) return { erro: "As duas passwords não são iguais." };
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return { erro: "Este link não é válido. Peça um novo." };

  const agora = new Date().toISOString();
  const { data: gastos } = await supabase
    .from("recuperacoes_senha")
    .update({ usado_em: agora })
    .eq("token_hash", hashDe(token))
    .is("usado_em", null)
    .gt("expira_em", agora)
    .select("usuario_id");
  const pedido = gastos?.[0];
  if (!pedido) return { erro: "Este link já foi usado ou expirou. Peça um novo." };

  // A hora vem do relógio deste servidor, o mesmo que data as sessões: assim
  // um login logo a seguir nunca parece "anterior" à mudança.
  const { data: conta, error } = await supabase
    .from("usuarios")
    .update({ senha_hash: await criarHash(senha), senha_alterada_em: agora })
    .eq("id", pedido.usuario_id)
    .select("email")
    .single();
  if (error || !conta) return { erro: "Não foi possível mudar a password. Tente de novo." };

  // Os outros links pendentes desta conta deixam de valer, e o bloqueio por
  // tentativas erradas recomeça do zero.
  await supabase
    .from("recuperacoes_senha")
    .update({ usado_em: agora })
    .eq("usuario_id", pedido.usuario_id)
    .is("usado_em", null);
  await supabase.from("tentativas_login").delete().eq("email", conta.email);

  redirect("/login?senha=alterada");
}
