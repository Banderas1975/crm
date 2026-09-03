"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../lib/supabase";
import { exigirSessao } from "./sessao-actions";
import { escreverFollowUp } from "../lib/ia";
import { LIMITES, emailValido } from "../lib/validacao";

const ETAPAS = ["novo", "em contato", "proposta", "cliente"];

// Junta indicativo + número num telefone só. Devolve { telefone } ou { erro }.
// Regra E.164: no máximo 15 dígitos somando indicativo e número.
function montarTelefone(indicativo, numeroCru) {
  const numero = (numeroCru || "").replace(/\D/g, "");
  if (!numero) return { telefone: null };

  const codigo = (indicativo || "").replace(/\D/g, "");
  if (!codigo) return { erro: "Escolha o indicativo do país do telefone." };

  // Portugal: sempre 9 dígitos, sem contar o indicativo.
  if (codigo === "351" && numero.length !== 9) {
    return {
      erro: `Telefone português inválido: tem de ter exatamente 9 dígitos, sem o indicativo (escreveu ${numero.length}).`,
    };
  }

  if (numero.length < 4 || codigo.length + numero.length > 15) {
    return { erro: "Telefone inválido. Escreva só os dígitos do número, sem o indicativo." };
  }
  return { telefone: `+${codigo} ${numero}` };
}

export async function salvarContato(estadoAnterior, dados) {
  await exigirSessao();

  const nome = dados.get("nome")?.trim();
  if (!nome) return { erro: "Escreva o nome do contato para salvar." };
  if (nome.length > LIMITES.nome) {
    return { erro: `O nome é muito comprido (máximo ${LIMITES.nome} caracteres).` };
  }

  const email = dados.get("email")?.trim() || null;
  if (email && !emailValido(email)) return { erro: "Esse email não parece válido." };
  if (email && email.length > LIMITES.email) {
    return { erro: `O email é muito comprido (máximo ${LIMITES.email} caracteres).` };
  }

  const { telefone, erro } = montarTelefone(dados.get("indicativo"), dados.get("telefone"));
  if (erro) return { erro };

  const { error } = await supabase.from("contatos").insert({ nome, email, telefone });
  if (error) return { erro: "Não foi possível salvar. Tente de novo." };

  revalidatePath("/");
  return { erro: "" };
}

export async function salvarAnotacao(dados) {
  await exigirSessao();

  const texto = dados.get("texto")?.trim();
  const contatoId = Number(dados.get("contato_id"));
  if (!texto || !contatoId || texto.length > LIMITES.anotacao) return;

  await supabase.from("anotacoes").insert({ contato_id: contatoId, texto });
  revalidatePath("/");
}

export async function editarAnotacao(dados) {
  await exigirSessao();

  const id = Number(dados.get("id"));
  const texto = dados.get("texto")?.trim();
  if (!id || !texto || texto.length > LIMITES.anotacao) return;

  await supabase.from("anotacoes").update({ texto }).eq("id", id);
  revalidatePath("/");
}

export async function excluirAnotacao(dados) {
  await exigirSessao();

  const id = Number(dados.get("id"));
  if (!id) return;

  await supabase.from("anotacoes").delete().eq("id", id);
  revalidatePath("/");
}

export async function gerarFollowUp(estadoAnterior, dados) {
  await exigirSessao();

  const contatoId = Number(dados.get("contato_id"));
  if (!contatoId) return { erro: "Contato não encontrado." };

  // Os dados vêm do banco, não do navegador: ninguém injeta um contato falso.
  const { data: contato } = await supabase
    .from("contatos")
    .select("nome, etapa")
    .eq("id", contatoId)
    .single();

  if (!contato) return { erro: "Contato não encontrado." };

  const { data: anotacoes } = await supabase
    .from("anotacoes")
    .select("texto")
    .eq("contato_id", contatoId)
    .order("criado_em", { ascending: false });

  try {
    const mensagem = await escreverFollowUp({
      nome: contato.nome,
      etapa: contato.etapa,
      anotacoes: (anotacoes ?? []).map((a) => a.texto),
    });

    if (!mensagem) return { erro: "A IA não devolveu nenhuma mensagem. Tente de novo." };
    return { mensagem };
  } catch (erro) {
    // O detalhe técnico fica no servidor; na tela vai só o essencial.
    console.error("Falha a gerar follow-up:", erro);
    return { erro: "Não foi possível gerar o follow-up agora. Tente de novo daqui a pouco." };
  }
}

export async function mudarEtapa(dados) {
  await exigirSessao();

  const id = Number(dados.get("contato_id"));
  const etapa = dados.get("etapa");
  // O banco também recusa etapas inválidas, mas assim nem chegamos a tentar.
  if (!id || !ETAPAS.includes(etapa)) return;

  await supabase.from("contatos").update({ etapa }).eq("id", id);
  revalidatePath("/");
}
