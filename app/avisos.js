// Os avisos por email: quem recebe o quê, e quando. Corre a cada poucos minutos,
// chamado pelo cron da VPS (ver app/emails/enviar/route.js). Também serve o
// botão "Enviar email de teste" da área Emails.
import { supabase } from "../lib/supabase";
import { enviarEmail } from "../lib/email";
import { hojeEmLisboa, emLisboa, formatarHora, formatarDia, somarDias, deLisboa } from "./tempo";
import { lerHora } from "../lib/validacao";

const MAX_TENTATIVAS = 3;
// Um envio "a enviar" há mais do que isto ficou preso (o servidor reiniciou a meio).
const PRESO_MS = 15 * 60 * 1000;
const HORA_RESUMO = 8 * 60; // 8h00 em Lisboa, em minutos
const HORA_MS = 60 * 60 * 1000;

const DIA_LONGO = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Lisbon",
});

const escapar = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const destino = (u) => u.email_avisos || u.email;
const endereco = (caminho) => (process.env.CRM_URL ? `${process.env.CRM_URL.replace(/\/$/, "")}${caminho}` : null);

// Email simples: um título, linhas de texto e, se houver, um link para o CRM.
function montar({ titulo, linhas, caminho }) {
  const link = caminho && endereco(caminho);
  const texto = [titulo, "", ...linhas, ...(link ? ["", `Abrir no CRM: ${link}`] : [])].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#151B24;line-height:1.5">
<h2 style="font-size:18px;margin:0 0 12px">${escapar(titulo)}</h2>
${linhas.map((l) => `<p style="margin:0 0 6px">${escapar(l)}</p>`).join("\n")}
${link ? `<p style="margin:16px 0 0"><a href="${escapar(link)}" style="color:#2563EB">Abrir no CRM</a></p>` : ""}
<p style="margin:24px 0 0;font-size:12px;color:#6B7280">Pode escolher que avisos recebe na área Emails do CRM.</p>
</div>`;
  return { texto, html };
}

// Envia um email uma única vez por chave. Primeiro grava a chave (única no
// banco); se já existir, o email já saiu ou está a sair noutra execução, e não
// sai outra vez. Só um envio que falhou é tentado de novo, até 3 vezes.
export async function enviarUmaVez({ usuarioId, chave, tipo, para, assunto, texto, html }) {
  const { data: novo, error } = await supabase
    .from("emails_enviados")
    .insert({ usuario_id: usuarioId, chave, tipo, para, assunto })
    .select("id")
    .single();

  let id = novo?.id;
  if (error) {
    if (error.code !== "23505") throw new Error(error.message); // 23505 = chave repetida
    const { data: existente } = await supabase
      .from("emails_enviados")
      .select("id, estado, tentativas, criado_em")
      .eq("chave", chave)
      .single();
    const preso = existente?.estado === "pendente" && Date.now() - Date.parse(existente.criado_em) > PRESO_MS;
    const falhou = existente?.estado === "falhou";
    if (!existente || !(falhou || preso) || existente.tentativas >= MAX_TENTATIVAS) return "ja";

    // Retomar só se ninguém o retomou entretanto (o estado e as tentativas têm de ser os mesmos).
    const { data: retomado } = await supabase
      .from("emails_enviados")
      .update({ estado: "pendente", tentativas: existente.tentativas + 1, para, erro: null })
      .eq("id", existente.id)
      .eq("estado", existente.estado)
      .eq("tentativas", existente.tentativas)
      .select("id");
    if (!retomado?.length) return "ja";
    id = existente.id;
  }

  try {
    await enviarEmail({ para, assunto, texto, html });
    await supabase.from("emails_enviados").update({ estado: "enviado", enviado_em: new Date().toISOString() }).eq("id", id);
    return "enviado";
  } catch (erro) {
    // Só a mensagem, curta: nunca credenciais nem o conteúdo do email.
    const mensagem = String(erro?.message ?? erro).slice(0, 300);
    console.error("Falha a enviar email:", mensagem);
    await supabase.from("emails_enviados").update({ estado: "falhou", erro: mensagem }).eq("id", id);
    return "falhou";
  }
}

async function utilizadores() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, email, email_avisos, aviso_tarefas, aviso_tarefa_antes, aviso_reuniao_antes, aviso_reuniao_alterada")
    .eq("estado", "aprovado");
  if (error) throw new Error(error.message);
  return new Map(data.map((u) => [u.id, u]));
}

// 1. Resumo das tarefas: uma vez por dia, a partir das 8h, se houver atrasadas ou de hoje.
async function resumoTarefas(contas, contagem) {
  const hoje = hojeEmLisboa();
  if (emLisboa(new Date()).minutos < HORA_RESUMO) return;

  for (const u of contas.values()) {
    if (!u.aviso_tarefas) continue;
    const chave = `tarefas:${hoje}:${u.id}`;

    // Já saiu hoje? Então nem vale a pena ir buscar as tarefas.
    const { data: feito } = await supabase.from("emails_enviados").select("estado").eq("chave", chave).maybeSingle();
    if (feito?.estado === "enviado") continue;

    const { data: tarefas } = await supabase
      .from("tarefas")
      .select("titulo, vence_em, vence_hora, contatos!tarefas_contato_dono(nome)")
      .eq("dono_id", u.id)
      .is("concluida_em", null)
      .not("vence_em", "is", null)
      .lte("vence_em", hoje)
      .order("vence_em")
      .order("vence_hora", { nullsFirst: false });
    if (!tarefas?.length) continue;

    const atrasadas = tarefas.filter((t) => t.vence_em < hoje);
    const deHoje = tarefas.filter((t) => t.vence_em === hoje);
    const linha = (t) =>
      `• ${t.vence_hora ? `${t.vence_hora.slice(0, 5)} ` : ""}${t.titulo} — ${t.contatos?.nome ?? ""}${t.vence_em < hoje ? ` (desde ${formatarDia(t.vence_em)})` : ""}`;

    const { texto, html } = montar({
      titulo: `Tarefas para hoje: ${deHoje.length}${atrasadas.length ? ` · atrasadas: ${atrasadas.length}` : ""}`,
      linhas: [
        ...(atrasadas.length ? ["Atrasadas:", ...atrasadas.map(linha), ""] : []),
        ...(deHoje.length ? ["Hoje:", ...deHoje.map(linha)] : []),
      ],
      caminho: "/tarefas",
    });

    contagem[await enviarUmaVez({
      usuarioId: u.id,
      chave,
      tipo: "tarefas",
      para: destino(u),
      assunto: `Tarefas de ${formatarDia(hoje)}: ${deHoje.length} hoje${atrasadas.length ? `, ${atrasadas.length} atrasadas` : ""}`,
      texto,
      html,
    })] += 1;
  }
}

// 2a. Uma hora antes de cada tarefa com hora: só para o dono, que é quem a faz.
// A hora está guardada como se lê em Lisboa; aqui passa a instante para comparar.
async function tarefasEmBreve(contas, contagem) {
  const agora = Date.now();
  const hoje = hojeEmLisboa();
  const { data: tarefas, error } = await supabase
    .from("tarefas")
    .select("id, titulo, vence_em, vence_hora, dono_id, contatos!tarefas_contato_dono(nome)")
    .is("concluida_em", null)
    .not("vence_hora", "is", null)
    .in("vence_em", [hoje, somarDias(hoje, 1)]);
  if (error) throw new Error(error.message);

  for (const t of tarefas) {
    const hora = t.vence_hora.slice(0, 5);
    const quando = Date.parse(deLisboa(t.vence_em, lerHora(hora)));
    if (quando <= agora || quando > agora + HORA_MS) continue;

    const u = contas.get(t.dono_id);
    if (!u?.aviso_tarefa_antes) continue;

    const minutosAte = Math.max(1, Math.round((quando - agora) / 60000));
    const { texto, html } = montar({
      titulo: `Daqui a ${minutosAte} min: ${t.titulo}`,
      linhas: [`Quando: ${formatarDia(t.vence_em)}, ${hora} (Lisboa)`, `Contato: ${t.contatos?.nome ?? ""}`],
      caminho: "/tarefas",
    });
    contagem[await enviarUmaVez({
      usuarioId: u.id,
      chave: `tarefa_antes:${t.id}:${t.vence_em}T${hora}:${u.id}`,
      tipo: "tarefa_antes",
      para: destino(u),
      assunto: `Tarefa daqui a ${minutosAte} min: ${t.titulo}`,
      texto,
      html,
    })] += 1;
  }
}

const SELECAO_REUNIAO =
  "id, titulo, inicio, duracao_min, local, dono_id, alterada_em, contatos!reunioes_contato_fk(nome), reuniao_usuarios(usuario_id), reuniao_contatos!reuniao_contatos_reuniao_dono(contatos!reuniao_contatos_contato_dono(nome))";

function detalhesReuniao(r, contas) {
  const { dia, minutos } = emLisboa(r.inicio);
  const participantes = [
    r.contatos?.nome,
    ...r.reuniao_contatos.map((p) => p.contatos?.nome),
    ...r.reuniao_usuarios.map((p) => contas.get(p.usuario_id)?.email),
  ].filter(Boolean);
  return {
    dia,
    linhas: [
      `Quando: ${DIA_LONGO.format(new Date(r.inicio))}, ${formatarHora(minutos)}–${formatarHora(minutos + r.duracao_min)} (Lisboa)`,
      ...(r.local ? [`Local: ${r.local}`] : []),
      `Participantes: ${participantes.join(", ")}`,
    ],
  };
}

// 2. Uma hora antes: para o dono e para os utilizadores participantes.
async function reunioesEmBreve(contas, contagem) {
  const agora = Date.now();
  const { data: reunioes, error } = await supabase
    .from("reunioes")
    .select(SELECAO_REUNIAO)
    .gt("inicio", new Date(agora).toISOString())
    .lte("inicio", new Date(agora + HORA_MS).toISOString());
  if (error) throw new Error(error.message);

  for (const r of reunioes) {
    const { dia, linhas } = detalhesReuniao(r, contas);
    const minutosAte = Math.max(1, Math.round((Date.parse(r.inicio) - agora) / 60000));
    const destinatarios = new Set([r.dono_id, ...r.reuniao_usuarios.map((p) => p.usuario_id)]);

    for (const uid of destinatarios) {
      const u = contas.get(uid);
      if (!u?.aviso_reuniao_antes) continue;
      const { texto, html } = montar({
        titulo: `Daqui a ${minutosAte} min: ${r.titulo}`,
        linhas,
        caminho: `/calendario?vista=dia&dia=${dia}`,
      });
      contagem[await enviarUmaVez({
        usuarioId: uid,
        chave: `reuniao_antes:${r.id}:${r.inicio}:${uid}`,
        tipo: "reuniao_antes",
        para: destino(u),
        assunto: `Reunião daqui a ${minutosAte} min: ${r.titulo}`,
        texto,
        html,
      })] += 1;
    }
  }
}

// 3. Marcada ou mudada: para os utilizadores participantes (o dono foi quem a
// marcou, já sabe). Só reuniões futuras, mexidas nas últimas 24 horas.
async function reunioesAlteradas(contas, contagem) {
  const agora = Date.now();
  const { data: reunioes, error } = await supabase
    .from("reunioes")
    .select(SELECAO_REUNIAO)
    .gte("alterada_em", new Date(agora - 24 * HORA_MS).toISOString())
    .gt("inicio", new Date(agora).toISOString());
  if (error) throw new Error(error.message);

  for (const r of reunioes) {
    const { dia, linhas } = detalhesReuniao(r, contas);
    for (const { usuario_id: uid } of r.reuniao_usuarios) {
      const u = contas.get(uid);
      if (uid === r.dono_id || !u?.aviso_reuniao_alterada) continue;

      // Já recebeu algum aviso desta reunião? Então desta vez é uma mudança.
      const { count } = await supabase
        .from("emails_enviados")
        .select("id", { count: "exact", head: true })
        .like("chave", `reuniao_alterada:${r.id}:%:${uid}`)
        .neq("chave", `reuniao_alterada:${r.id}:${r.inicio}:${uid}`);
      const palavra = count ? "mudada" : "marcada";
      const dono = contas.get(r.dono_id)?.email ?? "outro utilizador";

      const { texto, html } = montar({
        titulo: `Reunião ${palavra}: ${r.titulo}`,
        linhas: [`Por ${dono}.`, ...linhas],
        caminho: `/calendario?vista=dia&dia=${dia}`,
      });
      contagem[await enviarUmaVez({
        usuarioId: uid,
        chave: `reuniao_alterada:${r.id}:${r.inicio}:${uid}`,
        tipo: "reuniao_alterada",
        para: destino(u),
        assunto: `Reunião ${palavra}: ${r.titulo}`,
        texto,
        html,
      })] += 1;
    }
  }
}

// Tudo de uma vez. Devolve quantos saíram, quantos falharam e quantos já tinham saído.
export async function enviarAvisos() {
  const contas = await utilizadores();
  const contagem = { enviado: 0, falhou: 0, ja: 0 };
  await resumoTarefas(contas, contagem);
  await tarefasEmBreve(contas, contagem);
  await reunioesEmBreve(contas, contagem);
  await reunioesAlteradas(contas, contagem);
  return contagem;
}

export function emailDeTeste() {
  return montar({
    titulo: "Email de teste do CRM",
    linhas: [
      "Se está a ler isto, o envio de emails do CRM está a funcionar.",
      "Os avisos de tarefas e reuniões vão chegar a este endereço.",
    ],
    caminho: "/emails",
  });
}
