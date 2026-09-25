"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { supabase } from "../lib/supabase";
import { exigirSessao } from "./sessao-actions";
import { escreverFollowUp } from "../lib/ia";
import { ETAPAS } from "./etapas";
import { REPETICOES, proximaData } from "./tarefas";
import { hojeEmLisboa, deLisboa } from "./tempo";
import {
  LIMITES,
  emailValido,
  idValido,
  dataValida,
  TAMANHO_MAX_PROPOSTA,
  TIPOS_PROPOSTA,
  tipoDaProposta,
  lerValor,
  DURACOES,
  lerHora,
} from "../lib/validacao";

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

export async function criarTarefa(estadoAnterior, dados) {
  await exigirSessao();

  const contatoId = Number(dados.get("contato_id"));
  if (!idValido(contatoId)) return { erro: "Contato não encontrado." };

  const titulo = dados.get("titulo")?.trim();
  if (!titulo) return { erro: "Escreva o que é para fazer." };
  if (titulo.length > LIMITES.tarefa) {
    return { erro: `A tarefa é muito comprida (máximo ${LIMITES.tarefa} caracteres).` };
  }

  const venceEm = dados.get("vence_em") || null;
  if (venceEm && !dataValida(venceEm)) return { erro: "Essa data não existe." };

  const repete = dados.get("repete") || null;
  if (repete && !(repete in REPETICOES)) return { erro: "Repetição inválida." };
  // Sem data não há de onde contar a seguinte: a repetição ficaria parada.
  if (repete && !venceEm) return { erro: "Uma tarefa que se repete precisa de data." };

  const { error } = await supabase
    .from("tarefas")
    .insert({ contato_id: contatoId, titulo, vence_em: venceEm, repete });

  if (error) return { erro: "Não foi possível guardar a tarefa. Tente de novo." };

  revalidatePath("/", "layout");
  return { erro: "", salvo: (estadoAnterior?.salvo ?? 0) + 1 };
}

export async function concluirTarefa(idCru) {
  await exigirSessao();

  const id = Number(idCru);
  if (!idValido(id)) return { ok: false };

  // O "concluida_em is null" faz parte do próprio UPDATE: é o banco que decide,
  // numa operação só, quem foi o primeiro. Dois cliques seguidos, ou dois
  // separadores abertos, e o segundo não muda linha nenhuma — daí não sair
  // repetição a dobrar nem segunda entrada no histórico.
  const { data: concluidas, error } = await supabase
    .from("tarefas")
    .update({ concluida_em: new Date().toISOString() })
    .eq("id", id)
    .is("concluida_em", null)
    .select("contato_id, titulo, vence_em, repete");

  if (error) return { ok: false };

  const tarefa = concluidas?.[0];
  // Já estava concluída: o trabalho está feito, não há nada a corrigir.
  if (!tarefa) return { ok: true };

  // Só nasce a seguinte quando esta fecha, uma de cada vez. Nunca existe fila
  // à espera no banco, por isso não há como acumular tarefas sem fim.
  if (tarefa.repete && tarefa.vence_em) {
    await supabase.from("tarefas").insert({
      contato_id: tarefa.contato_id,
      titulo: tarefa.titulo,
      vence_em: proximaData(tarefa.vence_em, tarefa.repete, hojeEmLisboa()),
      repete: tarefa.repete,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// Chamada direto do kanban, que já tem o id e a etapa em mãos.
// Devolve { ok } para o cartão saber se ficou mesmo guardado.
export async function mudarEtapa(idCru, etapa) {
  await exigirSessao();

  const id = Number(idCru);
  // O banco também recusa etapas inválidas, mas assim nem chegamos a tentar.
  if (!idValido(id) || !ETAPAS.includes(etapa)) return { ok: false };

  // Ganho é estar em "cliente". Sair de lá desfaz o ganho, senão a página
  // continuava a mostrar um valor ganho num negócio que já não está fechado.
  const mudanca = etapa === "cliente" ? { etapa } : { etapa, proposta_ganha_id: null };

  const { error } = await supabase.from("contatos").update(mudanca).eq("id", id);
  if (error) return { ok: false };

  revalidatePath("/", "layout");
  return { ok: true };
}

// Cada envio é uma proposta nova: nome no Storage sempre novo e upsert
// desligado. Nada do que já lá está é substituído nem apagado.
export async function anexarProposta(estadoAnterior, dados) {
  await exigirSessao();

  const contatoId = Number(dados.get("contato_id"));
  if (!idValido(contatoId)) return { erro: "Contato não encontrado." };

  const ficheiro = dados.get("ficheiro");
  if (!(ficheiro instanceof File) || ficheiro.size === 0) {
    return { erro: "Escolha o ficheiro da proposta." };
  }
  if (ficheiro.size > TAMANHO_MAX_PROPOSTA) {
    return { erro: "A proposta é grande demais (máximo 4,5 MB)." };
  }

  const bytes = Buffer.from(await ficheiro.arrayBuffer());
  const tipo = tipoDaProposta(ficheiro.name, bytes);
  if (!tipo) return { erro: "Só são aceites ficheiros PDF, DOCX ou XLSX." };

  const valor = lerValor(dados.get("valor"));
  if (valor === null) return { erro: "Escreva o valor da proposta em euros, por exemplo 12500,00." };

  const { data: contato } = await supabase
    .from("contatos")
    .select("id")
    .eq("id", contatoId)
    .single();
  if (!contato) return { erro: "Contato não encontrado." };

  // O nome original só vive no banco, para mostrar na lista. No Storage o
  // ficheiro chama-se por um código aleatório: nenhum nome de pessoa ou
  // empresa fica à vista num caminho, num log ou num link.
  const nome = ficheiro.name.replace(/[\x00-\x1f\x7f/\\]/g, "").slice(-200) || `proposta.${tipo}`;
  const caminho = `${contatoId}/${randomUUID()}.${tipo}`;

  const { error: erroEnvio } = await supabase.storage
    .from("propostas")
    .upload(caminho, bytes, { contentType: TIPOS_PROPOSTA[tipo], upsert: false });

  if (erroEnvio) {
    console.error("Falha a enviar proposta:", erroEnvio.message);
    return { erro: "Não foi possível guardar a proposta. Tente de novo." };
  }

  const { error } = await supabase
    .from("propostas")
    .insert({ contato_id: contatoId, nome, caminho, tamanho: ficheiro.size, valor });

  if (error) {
    // Sem linha no banco ninguém chegaria a este ficheiro: tiramo-lo, para não
    // ficarem dados pessoais esquecidos no Storage.
    await supabase.storage.from("propostas").remove([caminho]);
    return { erro: "Não foi possível guardar a proposta. Tente de novo." };
  }

  revalidatePath("/", "layout");
  return { erro: "", salvo: (estadoAnterior?.salvo ?? 0) + 1 };
}

// O negócio fica ganho com o valor desta proposta: o contato passa a "cliente"
// e aponta para ela. O valor não é copiado — lê-se sempre da proposta.
export async function marcarGanho(dados) {
  await exigirSessao();

  const id = Number(dados.get("id"));
  if (!idValido(id)) return;

  const { data: proposta } = await supabase
    .from("propostas")
    .select("id, contato_id")
    .eq("id", id)
    .single();
  if (!proposta) return;

  await supabase
    .from("contatos")
    .update({ etapa: "cliente", proposta_ganha_id: proposta.id })
    .eq("id", proposta.contato_id);

  revalidatePath("/", "layout");
}

// Ids escolhidos numa lista de seleção múltipla. Só inteiros positivos, sem
// repetidos, e no máximo LIMITES.participantes — o resto é recusado inteiro.
function lerIds(valores) {
  const ids = [...new Set(valores.map(Number))];
  if (ids.length > LIMITES.participantes || !ids.every(idValido)) return null;
  return ids;
}

export async function criarReuniao(estadoAnterior, dados) {
  await exigirSessao();

  const contatoId = Number(dados.get("contato_id"));
  if (!idValido(contatoId)) return { erro: "Contato não encontrado." };

  const titulo = dados.get("titulo")?.trim();
  if (!titulo) return { erro: "Escreva o assunto da reunião." };
  if (titulo.length > LIMITES.reuniao) {
    return { erro: `O assunto é muito comprido (máximo ${LIMITES.reuniao} caracteres).` };
  }

  const dia = dados.get("dia");
  if (!dataValida(dia || "")) return { erro: "Escolha o dia da reunião." };

  const minutos = lerHora(dados.get("hora"));
  if (minutos === null) return { erro: "Escolha a hora da reunião." };

  const duracao = Number(dados.get("duracao"));
  if (!DURACOES.includes(duracao)) return { erro: "Duração inválida." };

  const local = dados.get("local")?.trim() || null;
  if (local && local.length > LIMITES.local) {
    return { erro: `O local é muito comprido (máximo ${LIMITES.local} caracteres).` };
  }

  // O contato principal já participa; se vier também na lista, sai dela.
  const contatos = lerIds(dados.getAll("contatos"));
  const usuarios = lerIds(dados.getAll("usuarios"));
  if (!contatos || !usuarios) {
    return { erro: `Escolha no máximo ${LIMITES.participantes} participantes de cada lista.` };
  }
  const outros = contatos.filter((id) => id !== contatoId);

  const { data: criada, error } = await supabase
    .from("reunioes")
    .insert({
      contato_id: contatoId,
      titulo,
      inicio: deLisboa(dia, minutos),
      duracao_min: duracao,
      local,
    })
    .select("id")
    .single();

  if (error || !criada) return { erro: "Não foi possível guardar a reunião. Tente de novo." };

  // O banco recusa ids que não existem (chaves estrangeiras). Se falhar,
  // a reunião sai também: melhor nada do que uma reunião com participantes a menos.
  const falhas = await Promise.all([
    outros.length &&
      supabase
        .from("reuniao_contatos")
        .insert(outros.map((id) => ({ reuniao_id: criada.id, contato_id: id }))),
    usuarios.length &&
      supabase
        .from("reuniao_usuarios")
        .insert(usuarios.map((id) => ({ reuniao_id: criada.id, usuario_id: id }))),
  ]);

  if (falhas.some((resultado) => resultado?.error)) {
    await supabase.from("reunioes").delete().eq("id", criada.id);
    return { erro: "Um dos participantes já não existe. Recarregue a página e tente de novo." };
  }

  revalidatePath("/", "layout");
  return { erro: "", salvo: (estadoAnterior?.salvo ?? 0) + 1 };
}

// Chamadas pelo calendário ao arrastar (ou pelas setas do teclado).
// Devolvem { ok } para o cartão saber se ficou mesmo guardado.

export async function moverTarefa(idCru, dia) {
  await exigirSessao();

  const id = Number(idCru);
  if (!idValido(id) || !dataValida(dia || "")) return { ok: false };

  // Só tarefas por fazer: as concluídas já não estão no calendário.
  const { error } = await supabase
    .from("tarefas")
    .update({ vence_em: dia })
    .eq("id", id)
    .is("concluida_em", null);
  if (error) return { ok: false };

  revalidatePath("/", "layout");
  return { ok: true };
}

// O dia e a hora chegam como se leem no calendário, em Lisboa; a conversão
// para o instante a gravar é feita aqui, nunca no navegador.
export async function moverReuniao(idCru, dia, minutos) {
  await exigirSessao();

  const id = Number(idCru);
  if (!idValido(id) || !dataValida(dia || "")) return { ok: false };
  if (!Number.isInteger(minutos) || minutos < 0 || minutos > 1439) return { ok: false };

  const { error } = await supabase
    .from("reunioes")
    .update({ inicio: deLisboa(dia, minutos) })
    .eq("id", id);
  if (error) return { ok: false };

  revalidatePath("/", "layout");
  return { ok: true };
}
