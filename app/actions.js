"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../lib/supabase";
import { exigirSessao } from "./sessao-actions";
import { escreverFollowUp } from "../lib/ia";
import { ETAPAS } from "./etapas";
import { LIMITES, emailValido, idValido } from "../lib/validacao";

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

  revalidatePath("/", "layout");
  // Quem manda para o funil (ou fecha a janela) é o formulário, no cliente:
  // um redirect aqui mataria o estado antes de o formulário saber que correu bem.
  return { erro: "", salvo: (estadoAnterior?.salvo ?? 0) + 1 };
}

export async function salvarAnotacao(dados) {
  await exigirSessao();

  const texto = dados.get("texto")?.trim();
  const contatoId = Number(dados.get("contato_id"));
  if (!idValido(contatoId) || !texto || texto.length > LIMITES.anotacao) return;

  await supabase.from("anotacoes").insert({ contato_id: contatoId, texto });
  revalidatePath("/", "layout");
}

export async function editarAnotacao(dados) {
  await exigirSessao();

  const id = Number(dados.get("id"));
  const texto = dados.get("texto")?.trim();
  if (!idValido(id) || !texto || texto.length > LIMITES.anotacao) return;

  await supabase.from("anotacoes").update({ texto }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function excluirAnotacao(dados) {
  await exigirSessao();

  const id = Number(dados.get("id"));
  if (!idValido(id)) return;

  await supabase.from("anotacoes").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function gerarFollowUp(estadoAnterior, dados) {
  await exigirSessao();

  const contatoId = Number(dados.get("contato_id"));
  if (!idValido(contatoId)) return { erro: "Contato não encontrado." };

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

    // Guardado com data: a mensagem passa a poder ser relida mais tarde.
    const { error } = await supabase
      .from("follow_ups")
      .insert({ contato_id: contatoId, texto: mensagem });

    if (error) {
      console.error("Falha a guardar follow-up:", error);
      return { erro: "A mensagem foi escrita, mas não deu para guardar. Tente de novo." };
    }

    revalidatePath("/", "layout");
    return { erro: "" };
  } catch (erro) {
    // O detalhe técnico fica no servidor; na tela vai só o essencial.
    console.error("Falha a gerar follow-up:", erro);
    return { erro: "Não foi possível gerar o follow-up agora. Tente de novo daqui a pouco." };
  }
}

// Chamada direto do kanban, que já tem o id e a etapa em mãos.
// Devolve { ok } para o cartão saber se ficou mesmo guardado.
export async function mudarEtapa(idCru, etapa) {
  await exigirSessao();

  const id = Number(idCru);
  // O banco também recusa etapas inválidas, mas assim nem chegamos a tentar.
  if (!idValido(id) || !ETAPAS.includes(etapa)) return { ok: false };

  const { error } = await supabase.from("contatos").update({ etapa }).eq("id", id);
  if (error) return { ok: false };

  revalidatePath("/", "layout");
  return { ok: true };
}
